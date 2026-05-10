using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using Project_KHDL.Server.Models;
using Project_KHDL.Server.Services;
using System.Text.Json;
using System.Linq;

namespace Project_KHDL.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly CsvDataService _csvData;
        private readonly IDistributedCache _cache;
        private readonly DistributedCacheEntryOptions _cacheOptions;

        public DashboardController(CsvDataService csvData, IDistributedCache cache)
        {
            _csvData = csvData;
            _cache = cache;
            _cacheOptions = new DistributedCacheEntryOptions()
                .SetSlidingExpiration(TimeSpan.FromMinutes(10))
                .SetAbsoluteExpiration(TimeSpan.FromHours(1));
        }

        private async Task<T> GetOrSetCacheAsync<T>(string cacheKey, Func<T> getDataFunc)
        {
            try
            {
                var cachedData = await _cache.GetStringAsync(cacheKey);
                if (!string.IsNullOrEmpty(cachedData))
                {
                    return JsonSerializer.Deserialize<T>(cachedData)!;
                }
            }
            catch { await _cache.RemoveAsync(cacheKey); }

            var data = getDataFunc();
            if (data != null)
            {
                var jsonData = JsonSerializer.Serialize(data);
                await _cache.SetStringAsync(cacheKey, jsonData, _cacheOptions);
            }
            return data!;
        }

        // ============================================================
        // --- CÁC HÀM CŨ (GIỮ NGUYÊN VỊ TRÍ - ĐÃ THÊM REDIS) ---
        // ============================================================

        [HttpGet("kpi")]
        public async Task<IActionResult> GetKpi()
        {
            var result = await GetOrSetCacheAsync("Dash_KPI_V_PRO_1", () =>
            {
                var activeCustomers = _csvData.Customers.ToList();
                var totalUsers = activeCustomers.Count;
                var totalSearch = activeCustomers.Sum(c => c.TotalSearch);
                return new
                {
                    totalUsers,
                    totalSearch,
                    avgSearchPerUser = totalUsers > 0 ? (double)totalSearch / totalUsers : 0,
                    updatedAt = _csvData.LoadedAt
                };
            });
            return Ok(result);
        }

        [HttpGet("monthly-trend")]
        public async Task<IActionResult> GetMonthlyTrend()
        {
            var result = await GetOrSetCacheAsync<List<object>>("Dash_Trend_Hour_V_PRO_1", () =>
            {
                return _csvData.FactSearchHourTrend;
            });
            return Ok(result ?? new List<object>());
        }

        [HttpGet("search-distribution")]
        public async Task<IActionResult> GetSearchDistribution()
        {
            var result = await GetOrSetCacheAsync<List<object>>("Dash_Fact_Trend_Month_V_PRO_1", () =>
            {
                return _csvData.FactSearchTrend;
            });
            return Ok(result ?? new List<object>());
        }

        [HttpGet("top-keywords")]
        public async Task<IActionResult> GetTopKeywords()
        {
            var result = await GetOrSetCacheAsync<List<object>>("Dash_Keywords_V_PRO_1", () =>
                _csvData.TopKeywords.OrderByDescending(k => k.SearchCount).Take(20)
                .Select(k => new { keyword = k.Keyword, searchCount = k.SearchCount })
                .Cast<object>().ToList());
            return Ok(result ?? new List<object>());
        }

        [HttpGet("segments")]
        public async Task<IActionResult> GetSegments()
        {
            var result = await GetOrSetCacheAsync("Dash_SegmentsSummary_V_PRO_MAPPING_FINAL", () =>
            {
                var clusters = new[] { 0, 1, 2, 3 };
                return clusters.Select(c => new
                {
                    cluster = c,
                    name = CsvDataService.GetSegmentName(c),
                    color = CsvDataService.GetClusterColor(c),
                    totalUsers = _csvData.Segments.Count(s => s.Cluster == c),
                    totalSearch = _csvData.Customers.Where(cu =>
                        _csvData.Segments.Any(s => s.Cluster == c && s.CustomerId == cu.CustomerId)).Sum(u => u.TotalSearch)
                }).ToList();
            });
            return Ok(result);
        }

        [HttpGet("top-categories")]
        public async Task<IActionResult> GetTopCategories()
        {
            var result = await GetOrSetCacheAsync<List<object>>("Dash_TopCats_V_PRO_1", () =>
                _csvData.TopCategories.Select(c => new {
                    category_name = c.category_name,
                    total_search = c.total_search,
                    percentage = c.percentage
                }).Cast<object>().ToList());
            return Ok(result ?? new List<object>());
        }

        [HttpGet("users/{id}")]
        public async Task<IActionResult> GetUserDetail(string id)
        {
            return Ok(await GetOrSetCacheAsync($"UserDetail_{id}_V_PRO_MAP_V2", () => {
                var customer = _csvData.Customers.FirstOrDefault(c => c.CustomerId == id);
                if (customer == null) return null;

                var clusterId = _csvData.Segments.FirstOrDefault(s => s.CustomerId == id)?.Cluster ?? 3;

                return new
                {
                    customerId = customer.CustomerId,
                    totalSearch = customer.TotalSearch,
                    cluster = clusterId,
                    segmentName = CsvDataService.GetSegmentName(clusterId),
                    topKeyword = _csvData.GetTopKeywordForUser(id),
                    topCategory = _csvData.GetTopCategoryForUser(id)
                };
            }));
        }

        [HttpGet("users/{id}/insight")]
        public async Task<IActionResult> GetUserInsight(string id)
        {
            return Ok(await GetOrSetCacheAsync($"UserInsight_{id}_V_PRO_MAP_V2", () => {
                var customer = _csvData.Customers.FirstOrDefault(c => c.CustomerId == id);
                if (customer == null) return null;

                var cluster = _csvData.Segments.FirstOrDefault(s => s.CustomerId == id)?.Cluster ?? 3;

                string behavior, meaning, action;
                if (cluster == 0)
                {
                    behavior = "Hành vi: Khách hàng hoạt động cực kỳ năng nổ, tìm kiếm đa dạng.";
                    meaning = "Ý nghĩa: Nhóm Highly Engaged - đóng góp giá trị lớn nhất.";
                    action = "Hành động: Duy trì ưu đãi VIP và tri ân đặc biệt.";
                }
                else if (cluster == 1)
                {
                    behavior = "Hành vi: Khách hàng sử dụng ở mức độ trung bình.";
                    meaning = "Ý nghĩa: Nhóm Casual Users - tiềm năng tăng trưởng cao.";
                    action = "Hành động: Gợi ý thêm nội dung mới để tăng tương tác.";
                }
                else if (cluster == 2)
                {
                    behavior = "Hành vi: Khách hàng chỉ tập trung vào vài thể loại nhất định.";
                    meaning = "Ý nghĩa: Nhóm Focused-Interest - cần cá nhân hóa sâu.";
                    action = "Hành động: Gửi thông báo đẩy về các chủ đề họ quan tâm.";
                }
                else
                {
                    behavior = "Hành vi: Khách hàng hoạt động rất thấp.";
                    meaning = "Ý nghĩa: Nhóm Low Activity - nguy cơ rời bỏ nền tảng.";
                    action = "Hành động: Gửi mã khuyến mãi hoặc email thu hút quay lại.";
                }

                return new
                {
                    cluster,
                    clusterName = CsvDataService.GetSegmentName(cluster),
                    behavior,
                    meaning,
                    action
                };
            }));
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] string? search, [FromQuery] int? cluster, [FromQuery] int page = 1, int pageSize = 16)
        {
            // THÊM REDIS CACHE
            string cacheKey = $"Dash_UsersList_S_{search ?? "all"}_C_{cluster?.ToString() ?? "all"}_P_{page}_PS_{pageSize}";

            var result = await GetOrSetCacheAsync(cacheKey, () => {
                var query = _csvData.Customers.AsEnumerable();

                if (!string.IsNullOrWhiteSpace(search))
                    query = query.Where(c => c.CustomerId.Contains(search, StringComparison.OrdinalIgnoreCase));

                if (cluster.HasValue)
                {
                    var ids = _csvData.Segments.Where(s => s.Cluster == cluster.Value).Select(s => s.CustomerId).ToHashSet();
                    query = query.Where(c => ids.Contains(c.CustomerId));
                }

                var totalCount = query.Count();
                var data = query.OrderByDescending(c => c.TotalSearch)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(c => {
                        var cId = _csvData.Segments.FirstOrDefault(s => s.CustomerId == c.CustomerId)?.Cluster ?? 3;
                        return new
                        {
                            customerId = c.CustomerId,
                            totalSearch = c.TotalSearch,
                            cluster = cId,
                            segmentName = CsvDataService.GetSegmentName(cId),
                            topCategory = _csvData.GetTopCategoryForUser(c.CustomerId)
                        };
                    }).ToList();

                return new { data, totalCount, page, pageSize };
            });

            return Ok(result);
        }

        [HttpGet("platform-distribution")]
        public async Task<IActionResult> GetPlatformDistribution()
        {
            var result = await GetOrSetCacheAsync<List<object>>("Dash_Platform_FULL_FINAL", () =>
            {
                return _csvData.FactSearchPlatformTrend;
            });
            return Ok(result ?? new List<object>());
        }

        // ============================================================
        // --- CÁC ENDPOINT SEGMENTATION (GIỮ NGUYÊN VỊ TRÍ - ĐÃ THÊM REDIS) ---
        // ============================================================

        [HttpGet("cluster-summaries")]
        public async Task<IActionResult> GetClusterSummaries()
        {
            var result = await GetOrSetCacheAsync("Dash_Cluster_Summaries_V3", () =>
            {
                return _csvData.ClusterSummaries.Select(s => new {
                    cluster = s.Cluster,
                    segmentName = CsvDataService.GetSegmentName(s.Cluster),
                    totalUsers = s.TotalUsers,
                    avgTotalSearch = s.AvgTotalSearch,
                    avgUniqueKeywords = s.AvgUniqueKeywords,
                    avgCategories = s.AvgCategories,
                    avgSearchPerMonth = s.AvgSearchPerMonth,
                    color = CsvDataService.GetClusterColor(s.Cluster)
                }).ToList();
            });
            return Ok(result);
        }

        [HttpGet("segment-scatter")]
        public async Task<IActionResult> GetSegmentScatter()
        {
            var result = await GetOrSetCacheAsync("Dash_Segment_Scatter_V3", () =>
            {
                return _csvData.Segments
                    .Join(_csvData.CustomerFeatures,
                          s => long.Parse(s.CustomerId),
                          f => long.Parse(f.CustomerId),
                          (s, f) => new {
                              customerId = s.CustomerId,
                              x = f.TotalSearch,
                              y = f.UniqueKeywordCount,
                              cluster = s.Cluster,
                              segmentName = CsvDataService.GetSegmentName(s.Cluster)
                          })
                    .Take(1000)
                    .ToList();
            });
            return Ok(result);
        }

        [HttpGet("segment-insights")]
        public async Task<IActionResult> GetSegmentInsights()
        {
            // THÊM REDIS CACHE
            var result = await GetOrSetCacheAsync("Dash_Segment_Insights_V_PRO_MAP", () => {
                return new[]
                {
                    new { cluster = 0, segmentName = CsvDataService.GetSegmentName(0), color = CsvDataService.GetClusterColor(0), title = "Core Value Users", text = "Người dùng hoạt động rất mạnh mẽ. Đây là nhóm khách hàng nòng cốt cần duy trì chiến lược giữ chân đặc biệt." },
                    new { cluster = 1, segmentName = CsvDataService.GetSegmentName(1), color = CsvDataService.GetClusterColor(1), title = "Growing Potential", text = "Nhóm khách hàng sử dụng dịch vụ ở mức trung bình. Có tiềm năng chuyển đổi thành nhóm Highly Engaged." },
                    new { cluster = 2, segmentName = CsvDataService.GetSegmentName(2), color = CsvDataService.GetClusterColor(2), title = "Targeted Interests", text = "Chỉ tập trung vào một vài thể loại nhất định. Cần đẩy mạnh gợi ý nội dung cùng sở thích." },
                    new { cluster = 3, segmentName = CsvDataService.GetSegmentName(3), color = CsvDataService.GetClusterColor(3), title = "Re-engagement Needed", text = "Hoạt động thấp. Cần các chiến dịch khuyến mãi hoặc thông báo quay lại để giảm tỷ lệ rời bỏ." }
                };
            });
            return Ok(result);
        }

        [HttpGet("segment-users")]
        public async Task<IActionResult> GetSegmentUsers([FromQuery] string? search, [FromQuery] int? cluster, [FromQuery] int page = 1, int pageSize = 15)
        {
            // THÊM REDIS CACHE
            string cacheKey = $"Dash_SegUsers_S_{search ?? "all"}_C_{cluster?.ToString() ?? "all"}_P_{page}";

            var result = await GetOrSetCacheAsync(cacheKey, () => {
                var query = _csvData.Segments
                    .Join(_csvData.CustomerFeatures,
                          s => long.Parse(s.CustomerId),
                          f => long.Parse(f.CustomerId),
                          (s, f) => new {
                              customerId = s.CustomerId,
                              cluster = s.Cluster,
                              segmentName = CsvDataService.GetSegmentName(s.Cluster),
                              totalSearch = f.TotalSearch,
                              uniqueKeywords = f.UniqueKeywordCount,
                              totalCategories = f.TotalCategories,
                              avgSearchMonth = f.AvgSearchPerMonth
                          });

                if (!string.IsNullOrEmpty(search))
                    query = query.Where(u => u.customerId.Contains(search));

                if (cluster.HasValue)
                    query = query.Where(u => u.cluster == cluster.Value);

                var totalCount = query.Count();
                var data = query.Skip((page - 1) * pageSize).Take(pageSize).ToList();

                return new { data, totalCount };
            });

            return Ok(result);
        }
    }
}