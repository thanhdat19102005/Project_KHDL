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
        
        // Fast Lookups
        private Dictionary<string, Customer360> _customerDict = new();
        private Dictionary<string, int> _segmentDict = new();
        private Dictionary<string, string> _mappingDict = new();
        private List<long> _keywordCumulativeWeights = new();
        private long _totalKeywordWeight = 0;

        private FileSystemWatcher? _watcher;
        private CancellationTokenSource? _reloadCts;

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
        private readonly RediSearchService _rediSearch;

        public CsvDataService(RediSearchService rediSearch)
        {
            _rediSearch = rediSearch;
            var possiblePaths = new[]
            {
                Path.Combine(Directory.GetCurrentDirectory(), "Data"),
                Path.Combine(Directory.GetCurrentDirectory(), "..", "Data"),
                Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "Data"),
                Path.Combine(AppContext.BaseDirectory, "Data"),
            };
            _dataPath = possiblePaths.FirstOrDefault(Directory.Exists) ?? possiblePaths[0];
            
            LoadAll();
            Console.WriteLine($"[CsvDataService] Data loaded at {LoadedAt}. Customers: {Customers.Count}");
            
            SetupWatcher();
            
            _ = Task.Run(async () => {
                await InitializeRedisAsync();
            });
        }

        private void SetupWatcher()
        {
            try
            {
                if (!Directory.Exists(_dataPath)) return;

                _watcher = new FileSystemWatcher(_dataPath, "*.csv")
                {
                    NotifyFilter = NotifyFilters.LastWrite | NotifyFilters.FileName | NotifyFilters.Size
                };

                _watcher.Changed += OnDataChanged;
                _watcher.Created += OnDataChanged;
                _watcher.Deleted += OnDataChanged;
                _watcher.Renamed += OnDataChanged;

                _watcher.EnableRaisingEvents = true;
                Console.WriteLine($"[CsvDataService] Monitoring directory for DE Pipeline updates: {_dataPath}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CsvDataService] Failed to setup watcher: {ex.Message}");
            }
        }

        private void OnDataChanged(object sender, FileSystemEventArgs e)
        {
            Console.WriteLine($"[CsvDataService] File change detected: {e.Name} ({e.ChangeType}). Triggering auto-reload...");
            
            _reloadCts?.Cancel();
            _reloadCts = new CancellationTokenSource();
            
            var token = _reloadCts.Token;
            _ = Task.Run(async () => {
                try {
                    await Task.Delay(2000, token);
                    if (token.IsCancellationRequested) return;

                    LoadAll();
                    
                    Console.WriteLine($"[CsvDataService] Data refreshed from DE Pipeline at {LoadedAt}");
                    await InitializeRedisAsync();
                } catch (TaskCanceledException) { }
                catch (Exception ex) {
                    Console.WriteLine($"[CsvDataService] Reload failed: {ex.Message}");
                }
            }, token);
        }

        private async Task InitializeRedisAsync()
        {
            Console.WriteLine("[CsvDataService] Updating RediSearch index with new pipeline data...");
            var currentCustomers = Customers;
            var currentSegments = Segments;
            
            var segmentDict = currentSegments.ToDictionary(s => s.CustomerId, s => s.Cluster);
            var searchData = currentCustomers.Select(c => new {
                c.CustomerId,
                c.TotalSearch,
                Cluster = segmentDict.TryGetValue(c.CustomerId, out var cl) ? cl : 2
            }).ToList();

            await _rediSearch.InitializeIndexAsync(searchData);
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

            // Double Buffering: Load into local variables first
            var newCustomers = new List<Customer360>();
            var newSegments = new List<CustomerSegment>();
            var newCustomerFeatures = new List<CustomerFeature>();
            var newSearchMonthly = new List<CustomerSearchMonthly>();
            var newTopKeywords = new List<CustomerTopKeyword>();
            var newMappings = new List<KeywordMapping>();

            LoadCustomers(config, newCustomers);
            LoadSegments(config, newSegments);
            LoadCustomerFeatures(config, newCustomerFeatures);
            LoadSearchMonthly(config, newSearchMonthly);
            LoadTopKeywords(config, newTopKeywords);
            LoadMappings(config, newMappings);

            var newClusterSummaries = CalculateClusterSummariesInternal(newSegments, newCustomerFeatures);
            var newTopCategories = LoadTopCategoriesInternal(config);
            var (trend, hour, plat) = LoadFactSearchActivityInternal(config);
            
            var newMappingDict = newMappings.ToDictionary(m => m.Keyword, m => m.Category);
            CalculateTotalSearchFromMonthlyInternal(newCustomers, newSearchMonthly, newSegments);

            var newKeywordCumulativeWeights = new List<long>();
            long cumulative = 0;
            foreach (var kw in newTopKeywords) { cumulative += kw.SearchCount; newKeywordCumulativeWeights.Add(cumulative); }
            long newTotalKeywordWeight = cumulative;

            // Atomic Swaps
            Customers = newCustomers;
            Segments = newSegments;
            CustomerFeatures = newCustomerFeatures;
            SearchMonthly = newSearchMonthly;
            TopKeywords = newTopKeywords;
            Mappings = newMappings;
            ClusterSummaries = newClusterSummaries;
            TopCategories = newTopCategories;
            FactSearchTrend = trend;
            FactSearchHourTrend = hour;
            FactSearchPlatformTrend = plat;

            _customerDict = newCustomers.ToDictionary(c => c.CustomerId);
            _segmentDict = newSegments.ToDictionary(s => s.CustomerId, s => s.Cluster);
            _mappingDict = newMappingDict;
            _keywordCumulativeWeights = newKeywordCumulativeWeights;
            _totalKeywordWeight = newTotalKeywordWeight;

            LoadedAt = DateTime.Now;
        }

        private void LoadCustomers(CsvConfiguration config, List<Customer360> target)
        {
            var path = Path.Combine(_dataPath, "customer_360.csv");
            if (!File.Exists(path)) return;
            using var reader = new StreamReader(path, System.Text.Encoding.UTF8);
            using var csv = new CsvReader(reader, config);
            var records = csv.GetRecords<dynamic>().ToList();
            foreach (var record in records)
            {
                var values = ((IDictionary<string, object>)record).Values.ToList();
                target.Add(new Customer360 { CustomerId = values[0]?.ToString() ?? string.Empty, TotalSearch = 0 });
            }
        }

        private void LoadSegments(CsvConfiguration config, List<CustomerSegment> target)
        {
            var path = Path.Combine(_dataPath, "customer_segment.csv");
            if (!File.Exists(path)) return;
            using var reader = new StreamReader(path);
            using var csv = new CsvReader(reader, config);
            target.AddRange(csv.GetRecords<CustomerSegment>().ToList());
        }

        private void LoadCustomerFeatures(CsvConfiguration config, List<CustomerFeature> target)
        {
            var path = Path.Combine(_dataPath, "customer_features.csv");
            if (!File.Exists(path)) return;
            using var reader = new StreamReader(path);
            using var csv = new CsvReader(reader, config);
            target.AddRange(csv.GetRecords<CustomerFeature>().ToList());
        }

        private void LoadSearchMonthly(CsvConfiguration config, List<CustomerSearchMonthly> target)
        {
            var path = Path.Combine(_dataPath, "customer_search_monthly.csv");
            if (!File.Exists(path)) return;
            using var reader = new StreamReader(path);
            using var csv = new CsvReader(reader, config);
            var records = csv.GetRecords<dynamic>().ToList();
            foreach (var record in records)
            {
                var v = ((IDictionary<string, object>)record).Values.ToList();
                target.Add(new CustomerSearchMonthly
                {
                    CustomerId = v[0]?.ToString() ?? "",
                    Month = v[1]?.ToString() ?? "",
                    SearchCount = long.TryParse(v[2]?.ToString(), out var s) ? s : 0
                });
            }
        }

        private void LoadTopKeywords(CsvConfiguration config, List<CustomerTopKeyword> target)
        {
            var path = Path.Combine(_dataPath, "customer_top_keyword.csv");
            if (!File.Exists(path)) return;
            using var reader = new StreamReader(path);
            using var csv = new CsvReader(reader, config);
            var records = csv.GetRecords<dynamic>().ToList();
            foreach (var record in records)
            {
                var v = ((IDictionary<string, object>)record).Values.ToList();
                target.Add(new CustomerTopKeyword { Keyword = v[0]?.ToString() ?? "", SearchCount = long.TryParse(v[1]?.ToString(), out var s) ? s : 0 });
            }
        }

        private void LoadMappings(CsvConfiguration config, List<KeywordMapping> target)
        {
            var path = Path.Combine(_dataPath, "mapping.csv");
            if (!File.Exists(path)) return;
            using var reader = new StreamReader(path);
            using var csv = new CsvReader(reader, config);
            var records = csv.GetRecords<dynamic>().ToList();
            foreach (var record in records)
            {
                var d = ((IDictionary<string, object>)record).Values.ToList();
                target.Add(new KeywordMapping { Keyword = d[0]?.ToString() ?? "", Category = d[1]?.ToString() ?? "" });
            }
        }

        private List<ClusterSummary> CalculateClusterSummariesInternal(List<CustomerSegment> segments, List<CustomerFeature> features)
        {
            if (!segments.Any() || !features.Any()) return new List<ClusterSummary>();
            var joined = segments
                .Join(features, s => long.Parse(s.CustomerId), f => long.Parse(f.CustomerId), (s, f) => new { s.Cluster, f })
                .ToList();

            return joined.GroupBy(x => x.Cluster)
                .Select(g => new ClusterSummary
                {
                    Cluster = g.Key,
                    Label = GetSegmentName(g.Key),
                    Color = GetClusterColor(g.Key),
                    TotalUsers = g.Count(),
                    AvgTotalSearch = Math.Round(g.Average(x => (double)x.f.TotalSearch), 2),
                    AvgUniqueKeywords = Math.Round(g.Average(x => (double)x.f.UniqueKeywordCount), 2),
                    AvgCategories = Math.Round(g.Average(x => (double)x.f.TotalCategories), 2),
                    AvgSearchPerMonth = Math.Round(g.Average(x => (double)x.f.AvgSearchPerMonth), 2)
                }).OrderBy(x => x.Cluster).ToList();
        }

        private List<TopCategory> LoadTopCategoriesInternal(CsvConfiguration config)
        {
            var factPath = Path.Combine(_dataPath, "fact_search.csv");
            var dimPath = Path.Combine(_dataPath, "dim_content_category.csv");
            if (!File.Exists(factPath) || !File.Exists(dimPath)) return new List<TopCategory>();
            
            using var r1 = new StreamReader(dimPath); using var c1 = new CsvReader(r1, config);
            var dimCats = c1.GetRecords<DimContentCategory>().ToList();
            using var r2 = new StreamReader(factPath); using var c2 = new CsvReader(r2, config);
            var factSearches = c2.GetRecords<FactSearch>().ToList();
            
            var query = factSearches.Where(f => f.content_category_id.HasValue)
                .Join(dimCats, f => (int)f.content_category_id!.Value, dc => dc.category_id, (f, dc) => dc.category_name)
                .GroupBy(n => n).Select(g => new { Name = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count).ToList();
            
            int grandTotal = query.Sum(x => x.Count);
            return query.Take(10).Select(x => new TopCategory
            {
                category_name = x.Name,
                total_search = x.Count,
                percentage = grandTotal > 0 ? Math.Round((double)x.Count * 100 / grandTotal, 2) : 0
            }).ToList();
        }

        private (List<object> trend, List<object> hour, List<object> plat) LoadFactSearchActivityInternal(CsvConfiguration config)
        {
            var path = Path.Combine(_dataPath, "fact_search.csv");
            if (!File.Exists(path)) return (new List<object>(), new List<object>(), new List<object>());
            
            using var reader = new StreamReader(path, System.Text.Encoding.UTF8);
            using var csv = new CsvReader(reader, config);
            var records = csv.GetRecords<FactSearch>().ToList();

            var trend = records.Where(f => !string.IsNullOrEmpty(f.event_time))
                .Select(f => DateTime.TryParse(f.event_time, out DateTime dt) ? dt.ToString("yyyy-MM") : "Unknown")
                .Where(m => m != "Unknown").GroupBy(m => m)
                .Select(g => new { search_month = g.Key, total_search = (long)g.Count() })
                .OrderBy(x => x.search_month).Cast<object>().ToList();

            var hour = records.Where(f => !string.IsNullOrEmpty(f.event_time))
                .Select(f => DateTime.TryParse(f.event_time, out DateTime dt) ? dt.Hour : -1)
                .Where(h => h != -1).GroupBy(h => h)
                .Select(g => new { search_hour = g.Key, total_search = (long)g.Count() })
                .OrderBy(x => x.search_hour).Cast<object>().ToList();

            var platGroups = records.Where(f => !string.IsNullOrEmpty(f.platform))
                .GroupBy(f => f.platform).Select(g => new { name = g.Key, value = (long)g.Count() })
                .OrderByDescending(x => x.value).ToList();

            long totalPlat = platGroups.Sum(x => x.value);
            var plat = platGroups.Select(p => new {
                platform = p.name, total_search = p.value,
                percentage = totalPlat > 0 ? Math.Round((double)p.value * 100 / totalPlat, 2) : 0
            }).Cast<object>().ToList();

            return (trend, hour, plat);
        }

        private void CalculateTotalSearchFromMonthlyInternal(List<Customer360> customers, List<CustomerSearchMonthly> searchMonthly, List<CustomerSegment> segments)
        {
            var totals = searchMonthly.GroupBy(s => s.CustomerId).ToDictionary(g => g.Key, g => g.Sum(x => x.SearchCount));
            var clusterMap = segments.ToDictionary(s => s.CustomerId, s => s.Cluster);

            foreach (var customer in customers)
            {
                if (totals.TryGetValue(customer.CustomerId, out var total)) customer.TotalSearch = total;
                if (clusterMap.TryGetValue(customer.CustomerId, out var cId)) customer.Cluster = cId;
            }
        }

        public static string GetSegmentName(int clusterId) => clusterId switch
        {
            0 => "Highly Engaged Users",
            1 => "Casual Users",
            2 => "Focused-Interest Users",
            3 => "Low Activity Users",
            _ => "General Users"
        };

        public static string GetClusterColor(int clusterId) => clusterId switch
        {
            0 => "#10b981", 1 => "#3b82f6", 2 => "#f59e0b", 3 => "#ef4444", _ => "#94a3b8"
        };

        public string GetTopKeywordForUser(string customerId)
        {
            var weights = _keywordCumulativeWeights;
            var total = _totalKeywordWeight;
            var keywords = TopKeywords;

            if (keywords.Count == 0 || total == 0) return "General";
            int hash = Math.Abs(customerId.GetHashCode());
            long target = hash % total;
            for (int i = 0; i < weights.Count; i++) if (target < weights[i]) return keywords[i].Keyword;
            return keywords.LastOrDefault()?.Keyword ?? "General";
        }

        public string GetTopCategoryForUser(string customerId)
        {
            var kw = GetTopKeywordForUser(customerId);
            return _mappingDict.TryGetValue(kw, out var cat) ? cat : "Other";
        }

        public Customer360? GetCustomer(string id) => _customerDict.TryGetValue(id, out var c) ? c : null;
        public int GetCluster(string id) => _segmentDict.TryGetValue(id, out var cl) ? cl : 2;
    }
}