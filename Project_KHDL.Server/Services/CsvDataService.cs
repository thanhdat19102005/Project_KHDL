using CsvHelper;
using CsvHelper.Configuration;
using Project_KHDL.Server.Models;
using System.Globalization;

namespace Project_KHDL.Server.Services
{
    public class CsvDataService
    {
        public List<Customer360> Customers { get; private set; } = new();
        public List<CustomerSegment> Segments { get; private set; } = new();
        public List<CustomerSearchMonthly> SearchMonthly { get; private set; } = new();
        public List<CustomerTopKeyword> TopKeywords { get; private set; } = new();
        public List<KeywordMapping> Mappings { get; private set; } = new();
        public List<TopCategory> TopCategories { get; private set; } = new();
        public List<object> FactSearchTrend { get; private set; } = new();
        public List<object> FactSearchHourTrend { get; private set; } = new();


        // 1. Thêm biến này vào class CsvDataService
        public List<object> FactSearchPlatformTrend { get; private set; } = new();



        public DateTime LoadedAt { get; private set; }
        private readonly string _dataPath;

        public CsvDataService()
        {
            var possiblePaths = new[]
            {
                Path.Combine(Directory.GetCurrentDirectory(), "Data"),
                Path.Combine(Directory.GetCurrentDirectory(), "..", "Data"),
                Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "Data"),
                Path.Combine(AppContext.BaseDirectory, "Data"),
            };
            _dataPath = possiblePaths.FirstOrDefault(Directory.Exists) ?? possiblePaths[0];
            LoadAll();
        }

        private void LoadAll()
        {
            // Dùng HasHeaderRecord = true vì hầu hết file của bạn có tiêu đề
            var config = new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = true,
                BadDataFound = null,
                MissingFieldFound = null,
                HeaderValidated = null
            };

            LoadCustomers(config);
            LoadSearchMonthly(config);
            CalculateTotalSearchFromMonthly();
            LoadTopKeywords(config);
            LoadMappings(config);
            GenerateSegments();
            LoadTopCategories();
            LoadFactSearchActivity();
            BuildKeywordDistribution();
            LoadedAt = DateTime.Now;
        }

        private void LoadFactSearchActivity()
        {
            var path = Path.Combine(_dataPath, "fact_search.csv");
            if (!File.Exists(path)) return;

            var config = new CsvConfiguration(CultureInfo.InvariantCulture) { HasHeaderRecord = true };
            using var reader = new StreamReader(path, System.Text.Encoding.UTF8);
            using var csv = new CsvReader(reader, config);
            var records = csv.GetRecords<FactSearch>().ToList();

            // 1. Biểu đồ trái: Group by Tháng (yyyy-MM) - Cách làm an toàn hơn
            FactSearchTrend = records
                .Where(f => !string.IsNullOrEmpty(f.event_time))
                .Select(f => {
                    if (DateTime.TryParse(f.event_time, out DateTime dt))
                        return dt.ToString("yyyy-MM");
                    return "Unknown";
                })
                .Where(m => m != "Unknown")
                .GroupBy(month => month)
                .Select(g => new { search_month = g.Key, total_search = (long)g.Count() })
                .OrderBy(x => x.search_month).Cast<object>().ToList();

            // 2. Biểu đồ phải: Group by Giờ (0-23) - ĐÚNG THEO SQL
            FactSearchHourTrend = records
                .Where(f => !string.IsNullOrEmpty(f.event_time))
                .Select(f => {
                    if (DateTime.TryParse(f.event_time, out DateTime dt)) return dt.Hour;
                    return -1;
                })
                .Where(h => h != -1) // Bỏ qua dữ liệu lỗi
                .GroupBy(hour => hour)
                .Select(g => new { search_hour = g.Key, total_search = (long)g.Count() })
                .OrderBy(x => x.search_hour).Cast<object>().ToList();





            // 3. Phân bổ Platform - HIỆN TOÀN BỘ THIẾT BỊ
            var allPlatformGroups = records
                .Where(f => !string.IsNullOrEmpty(f.platform))
                .GroupBy(f => f.platform)
                .Select(g => new { name = g.Key, value = (long)g.Count() })
                .OrderByDescending(x => x.value) // Sắp xếp từ nhiều nhất đến ít nhất
                .ToList();

            long totalPlat = allPlatformGroups.Sum(x => x.value);

            // Chuyển toàn bộ danh sách sang FactSearchPlatformTrend mà không bỏ sót cái nào
            FactSearchPlatformTrend = allPlatformGroups.Select(p => new {
                platform = p.name,
                total_search = p.value,
                percentage = totalPlat > 0 ? Math.Round((double)p.value * 100 / totalPlat, 2) : 0
            }).Cast<object>().ToList();











        }

        private void LoadCustomers(CsvConfiguration config)
        {
            var path = Path.Combine(_dataPath, "customer_360.csv");
            if (!File.Exists(path)) return;
            using var reader = new StreamReader(path, System.Text.Encoding.UTF8);
            using var csv = new CsvReader(reader, config);
            // Đọc và bỏ qua dòng đầu nếu file có header
            var records = csv.GetRecords<dynamic>().ToList();
            foreach (var record in records)
            {
                var values = ((IDictionary<string, object>)record).Values.ToList();
                Customers.Add(new Customer360 { CustomerId = values[0]?.ToString() ?? string.Empty, TotalSearch = 0 });
            }
        }

        private void LoadSearchMonthly(CsvConfiguration config)
        {
            var path = Path.Combine(_dataPath, "customer_search_monthly.csv");
            if (!File.Exists(path)) return;
            using var reader = new StreamReader(path); using var csv = new CsvReader(reader, config);
            var records = csv.GetRecords<dynamic>().ToList();
            foreach (var record in records)
            {
                var v = ((IDictionary<string, object>)record).Values.ToList();
                SearchMonthly.Add(new CustomerSearchMonthly
                {
                    CustomerId = v[0]?.ToString() ?? "",
                    Month = v[1]?.ToString() ?? "",
                    SearchCount = long.TryParse(v[2]?.ToString(), out var s) ? s : 0
                });
            }
        }

        private void CalculateTotalSearchFromMonthly()
        {
            var monthlyTotals = SearchMonthly.GroupBy(s => s.CustomerId).ToDictionary(g => g.Key, g => g.Sum(x => x.SearchCount));
            foreach (var customer in Customers)
                if (monthlyTotals.TryGetValue(customer.CustomerId, out var total)) customer.TotalSearch = total;
        }

        private void LoadTopKeywords(CsvConfiguration config)
        {
            var path = Path.Combine(_dataPath, "customer_top_keyword.csv");
            if (!File.Exists(path)) return;
            using var reader = new StreamReader(path); using var csv = new CsvReader(reader, config);
            var records = csv.GetRecords<dynamic>().ToList();
            foreach (var record in records)
            {
                var v = ((IDictionary<string, object>)record).Values.ToList();
                TopKeywords.Add(new CustomerTopKeyword { Keyword = v[0]?.ToString() ?? "", SearchCount = long.TryParse(v[1]?.ToString(), out var s) ? s : 0 });
            }
        }

        private void LoadMappings(CsvConfiguration config)
        {
            var path = Path.Combine(_dataPath, "mapping.csv");
            if (!File.Exists(path)) return;
            using var reader = new StreamReader(path); using var csv = new CsvReader(reader, config);
            var records = csv.GetRecords<dynamic>().ToList();
            foreach (var record in records)
            {
                var d = ((IDictionary<string, object>)record).Values.ToList();
                Mappings.Add(new KeywordMapping { Keyword = d[0]?.ToString() ?? "", Category = d[1]?.ToString() ?? "" });
            }
        }

        private void GenerateSegments()
        {
            var path = Path.Combine(_dataPath, "customer_segment.csv");
            if (File.Exists(path))
            {
                var config = new CsvConfiguration(CultureInfo.InvariantCulture) { HasHeaderRecord = true };
                using var reader = new StreamReader(path); using var csv = new CsvReader(reader, config);
                var records = csv.GetRecords<dynamic>().ToList();
                foreach (var record in records)
                {
                    var v = ((IDictionary<string, object>)record).Values.ToList();
                    Segments.Add(new CustomerSegment { CustomerId = v[0]?.ToString() ?? "", Cluster = int.TryParse(v[1]?.ToString(), out var c) ? c : 2 });
                }
            }
            else
            {
                var sorted = Customers.OrderByDescending(x => x.TotalSearch).ToList();
                int total = sorted.Count; int vip = (int)(total * 0.2); int churn = (int)(total * 0.3);
                for (int i = 0; i < total; i++) Segments.Add(new CustomerSegment { CustomerId = sorted[i].CustomerId, Cluster = i < vip ? 0 : (i < vip + churn ? 1 : 2) });
            }
        }

        private void LoadTopCategories()
        {
            var factPath = Path.Combine(_dataPath, "fact_search.csv");
            var dimPath = Path.Combine(_dataPath, "dim_content_category.csv");
            if (!File.Exists(factPath) || !File.Exists(dimPath)) return;

            var config = new CsvConfiguration(CultureInfo.InvariantCulture) { HasHeaderRecord = true };
            using var r1 = new StreamReader(dimPath); using var c1 = new CsvReader(r1, config);
            var dimCategories = c1.GetRecords<DimContentCategory>().ToList();

            using var r2 = new StreamReader(factPath); using var c2 = new CsvReader(r2, config);
            var factSearches = c2.GetRecords<FactSearch>().ToList();

            var query = factSearches.Where(f => f.content_category_id.HasValue)
                .Join(dimCategories, f => (int)f.content_category_id!.Value, dc => dc.category_id, (f, dc) => dc.category_name)
                .GroupBy(name => name).Select(g => new { Name = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count).ToList();

            int grandTotal = query.Sum(x => x.Count);
            TopCategories = query.Take(10).Select(x => new TopCategory
            {
                category_name = x.Name,
                total_search = x.Count,
                percentage = grandTotal > 0 ? Math.Round((double)x.Count * 100 / grandTotal, 2) : 0
            }).ToList();
        }

        private List<long> _keywordCumulativeWeights = new();
        private long _totalKeywordWeight = 0;
        private void BuildKeywordDistribution()
        {
            long cumulative = 0;
            foreach (var kw in TopKeywords) { cumulative += kw.SearchCount; _keywordCumulativeWeights.Add(cumulative); }
            _totalKeywordWeight = cumulative;
        }

        public string GetTopKeywordForUser(string customerId)
        {
            if (TopKeywords.Count == 0 || _totalKeywordWeight == 0) return "General";
            int hash = Math.Abs(customerId.GetHashCode());
            long target = hash % _totalKeywordWeight;
            for (int i = 0; i < _keywordCumulativeWeights.Count; i++) if (target < _keywordCumulativeWeights[i]) return TopKeywords[i].Keyword;
            return TopKeywords.LastOrDefault()?.Keyword ?? "General";
        }

        public string GetTopCategoryForUser(string customerId)
        {
            var kw = GetTopKeywordForUser(customerId);
            return Mappings.FirstOrDefault(m => m.Keyword == kw)?.Category ?? "Other";
        }
    }
}