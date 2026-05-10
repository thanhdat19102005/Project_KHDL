using CsvHelper;
using CsvHelper.Configuration;
using Project_KHDL.Server.Models;
using System.Globalization;
using System.Linq;
using System.Collections.Generic;
using System.IO;

namespace Project_KHDL.Server.Services
{
    public class CsvDataService
    {
        public List<Customer360> Customers { get; private set; } = new();
        public List<CustomerSegment> Segments { get; private set; } = new();

        // --- DỮ LIỆU TASK SEGMENTATION ---
        public List<CustomerFeature> CustomerFeatures { get; private set; } = new();
        public List<ClusterSummary> ClusterSummaries { get; private set; } = new();

        public List<CustomerSearchMonthly> SearchMonthly { get; private set; } = new();
        public List<CustomerTopKeyword> TopKeywords { get; private set; } = new();
        public List<KeywordMapping> Mappings { get; private set; } = new();
        public List<TopCategory> TopCategories { get; private set; } = new();
        public List<object> FactSearchTrend { get; private set; } = new();
        public List<object> FactSearchHourTrend { get; private set; } = new();
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

            // TASK SEGMENTATION
            LoadSegments(config);
            LoadCustomerFeatures(config);
            CalculateClusterSummaries();

            LoadTopCategories();
            LoadFactSearchActivity();
            BuildKeywordDistribution();
            LoadedAt = DateTime.Now;
        }

        // =========================================================================
        // --- BƯỚC 1: CLUSTER BUSINESS MAPPING LAYER (Backend Implementation) ---
        // =========================================================================

        /// <summary>
        /// Mapping Layer: Chuyển đổi Cluster ID sang Business Label chuẩn.
        /// Sử dụng phương thức Static để tất cả các Controller/API có thể truy cập.
        /// </summary>
        public static string GetSegmentName(int clusterId) => clusterId switch
        {
            0 => "Highly Engaged Users",
            1 => "Casual Users",
            2 => "Focused-Interest Users",
            3 => "Low Activity Users",
            _ => "General Users"
        };

        /// <summary>
        /// Mapping Layer cho màu sắc phân cụm (Đồng bộ toàn hệ thống)
        /// </summary>
        public static string GetClusterColor(int clusterId) => clusterId switch
        {
            0 => "#10b981", // VIP - Green
            1 => "#3b82f6", // Casual - Blue
            2 => "#f59e0b", // Focused - Orange
            3 => "#ef4444", // Low - Red
            _ => "#94a3b8"
        };

        // =========================================================================

        private void LoadSegments(CsvConfiguration config)
        {
            var path = Path.Combine(_dataPath, "customer_segment.csv");
            if (!File.Exists(path)) return;
            using var reader = new StreamReader(path);
            using var csv = new CsvReader(reader, config);
            Segments = csv.GetRecords<CustomerSegment>().ToList();
        }

        private void LoadCustomerFeatures(CsvConfiguration config)
        {
            var path = Path.Combine(_dataPath, "customer_features.csv");
            if (!File.Exists(path)) return;
            using var reader = new StreamReader(path);
            using var csv = new CsvReader(reader, config);
            CustomerFeatures = csv.GetRecords<CustomerFeature>().ToList();
        }

        private void CalculateClusterSummaries()
        {
            if (!Segments.Any() || !CustomerFeatures.Any()) return;

            // Join dữ liệu theo Long ID để tránh lỗi Padding số 0
            var joined = Segments
                .Join(CustomerFeatures,
                      s => long.Parse(s.CustomerId),
                      f => long.Parse(f.CustomerId),
                      (s, f) => new { s.Cluster, f })
                .ToList();

            ClusterSummaries = joined
                .GroupBy(x => x.Cluster)
                .Select(g => new ClusterSummary
                {
                    Cluster = g.Key,
                    // SỬ DỤNG MAPPING LAYER CHO LABEL
                    Label = GetSegmentName(g.Key),
                    Color = GetClusterColor(g.Key),
                    TotalUsers = g.Count(),
                    AvgTotalSearch = Math.Round(g.Average(x => (double)x.f.TotalSearch), 2),
                    AvgUniqueKeywords = Math.Round(g.Average(x => (double)x.f.UniqueKeywordCount), 2),
                    AvgCategories = Math.Round(g.Average(x => (double)x.f.TotalCategories), 2),
                    AvgSearchPerMonth = Math.Round(g.Average(x => (double)x.f.AvgSearchPerMonth), 2)
                })
                .OrderBy(x => x.Cluster)
                .ToList();
        }

        // --- CÁC HÀM CŨ GIỮ NGUYÊN (LoadCustomers, LoadSearchMonthly, FactSearchActivity...) ---

        private void LoadFactSearchActivity()
        {
            var path = Path.Combine(_dataPath, "fact_search.csv");
            if (!File.Exists(path)) return;
            var config = new CsvConfiguration(CultureInfo.InvariantCulture) { HasHeaderRecord = true };
            using var reader = new StreamReader(path, System.Text.Encoding.UTF8);
            using var csv = new CsvReader(reader, config);
            var records = csv.GetRecords<FactSearch>().ToList();

            FactSearchTrend = records
                .Where(f => !string.IsNullOrEmpty(f.event_time))
                .Select(f => {
                    if (DateTime.TryParse(f.event_time, out DateTime dt)) return dt.ToString("yyyy-MM");
                    return "Unknown";
                })
                .Where(m => m != "Unknown")
                .GroupBy(m => m)
                .Select(g => new { search_month = g.Key, total_search = (long)g.Count() })
                .OrderBy(x => x.search_month).Cast<object>().ToList();

            FactSearchHourTrend = records
                .Where(f => !string.IsNullOrEmpty(f.event_time))
                .Select(f => {
                    if (DateTime.TryParse(f.event_time, out DateTime dt)) return dt.Hour;
                    return -1;
                })
                .Where(h => h != -1)
                .GroupBy(h => h)
                .Select(g => new { search_hour = g.Key, total_search = (long)g.Count() })
                .OrderBy(x => x.search_hour).Cast<object>().ToList();

            var allPlatformGroups = records
                .Where(f => !string.IsNullOrEmpty(f.platform))
                .GroupBy(f => f.platform)
                .Select(g => new { name = g.Key, value = (long)g.Count() })
                .OrderByDescending(x => x.value).ToList();

            long totalPlat = allPlatformGroups.Sum(x => x.value);
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
            var totals = SearchMonthly.GroupBy(s => s.CustomerId).ToDictionary(g => g.Key, g => g.Sum(x => x.SearchCount));
            var clusterMap = Segments.ToDictionary(s => s.CustomerId, s => s.Cluster);

            foreach (var customer in Customers)
            {
                if (totals.TryGetValue(customer.CustomerId, out var total)) customer.TotalSearch = total;
                if (clusterMap.TryGetValue(customer.CustomerId, out var cId)) customer.Cluster = cId;
                customer.TopCategory = GetTopCategoryForUser(customer.CustomerId);
            }
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

        private void LoadTopCategories()
        {
            var factPath = Path.Combine(_dataPath, "fact_search.csv");
            var dimPath = Path.Combine(_dataPath, "dim_content_category.csv");
            if (!File.Exists(factPath) || !File.Exists(dimPath)) return;
            var config = new CsvConfiguration(CultureInfo.InvariantCulture) { HasHeaderRecord = true };
            using var r1 = new StreamReader(dimPath); using var c1 = new CsvReader(r1, config);
            var dimCats = c1.GetRecords<DimContentCategory>().ToList();
            using var r2 = new StreamReader(factPath); using var c2 = new CsvReader(r2, config);
            var factSearches = c2.GetRecords<FactSearch>().ToList();
            var query = factSearches.Where(f => f.content_category_id.HasValue)
                .Join(dimCats, f => (int)f.content_category_id!.Value, dc => dc.category_id, (f, dc) => dc.category_name)
                .GroupBy(n => n).Select(g => new { Name = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count).ToList();
            int grandTotal = query.Sum(x => x.Count);
            TopCategories = query.Take(10).Select(x => new TopCategory
            {
                category_name = x.Name,
                total_search = x.Count,
                percentage = grandTotal > 0 ? Math.Round((double)x.Count * 100 / grandTotal, 2) : 0
            }).ToList();
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