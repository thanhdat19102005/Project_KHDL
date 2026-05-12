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
        private readonly RediSearchService _searchService;

        public DashboardController(CsvDataService csvData, RediSearchService searchService)
        {
            _csvData = csvData;
            _searchService = searchService;
        }

        // ============================================================
        // --- CÁC HÀM CŨ (GIỮ NGUYÊN VỊ TRÍ) ---
        // ============================================================

        [HttpGet("kpi")]
        public IActionResult GetKpi()
        {
            var activeCustomers = _csvData.Customers.ToList();
            var totalUsers = activeCustomers.Count;
            var totalSearch = activeCustomers.Sum(c => c.TotalSearch);
            var result = new
            {
                totalUsers,
                totalSearch,
                avgSearchPerUser = totalUsers > 0 ? (double)totalSearch / totalUsers : 0,
                updatedAt = _csvData.LoadedAt
            };
            return Ok(result);
        }

        [HttpGet("monthly-trend")]
        public IActionResult GetMonthlyTrend()
        {
            var result = _csvData.FactSearchHourTrend;
            return Ok(result ?? new List<object>());
        }

        [HttpGet("search-distribution")]
        public IActionResult GetSearchDistribution()
        {
            var result = _csvData.FactSearchTrend;
            return Ok(result ?? new List<object>());
        }

        [HttpGet("top-keywords")]
        public IActionResult GetTopKeywords()
        {
            var result = _csvData.TopKeywords.OrderByDescending(k => k.SearchCount).Take(20)
                .Select(k => new { keyword = k.Keyword, searchCount = k.SearchCount })
                .Cast<object>().ToList();
            return Ok(result ?? new List<object>());
        }

        [HttpGet("segments")]
        public IActionResult GetSegments()
        {
            var clusters = new[] { 0, 1, 2, 3 };
            var result = clusters.Select(c => new
            {
                cluster = c,
                name = CsvDataService.GetSegmentName(c),
                color = CsvDataService.GetClusterColor(c),
                totalUsers = _csvData.Segments.Count(s => s.Cluster == c),
                totalSearch = _csvData.Customers.Where(cu =>
                    _csvData.Segments.Any(s => s.Cluster == c && s.CustomerId == cu.CustomerId)).Sum(u => u.TotalSearch)
            }).ToList();
            return Ok(result);
        }

        [HttpGet("top-categories")]
        public IActionResult GetTopCategories()
        {
            var result = _csvData.TopCategories.Select(c => new {
                category_name = c.category_name,
                total_search = c.total_search,
                percentage = c.percentage
            }).Cast<object>().ToList();
            return Ok(result ?? new List<object>());
        }

        [HttpGet("users/{id}")]
        public IActionResult GetUserDetail(string id)
        {
            var customer = _csvData.Customers.FirstOrDefault(c => c.CustomerId == id);
            if (customer == null) return Ok(null);

            var clusterId = _csvData.Segments.FirstOrDefault(s => s.CustomerId == id)?.Cluster ?? 3;

            return Ok(new
            {
                customerId = customer.CustomerId,
                totalSearch = customer.TotalSearch,
                cluster = clusterId,
                segmentName = CsvDataService.GetSegmentName(clusterId),
                topKeyword = _csvData.GetTopKeywordForUser(id),
                topCategory = _csvData.GetTopCategoryForUser(id)
            });
        }

        [HttpGet("users/{id}/insight")]
        public IActionResult GetUserInsight(string id)
        {
            var customer = _csvData.Customers.FirstOrDefault(c => c.CustomerId == id);
            if (customer == null) return Ok(null);

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

            return Ok(new
            {
                cluster,
                clusterName = CsvDataService.GetSegmentName(cluster),
                behavior,
                meaning,
                action
            });
        }

        [HttpGet("suggestions")]
        public async Task<IActionResult> GetSuggestions([FromQuery] string query)
        {
            var suggestions = await _searchService.GetSuggestionsAsync(query);
            return Ok(suggestions);
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] string? search, [FromQuery] int? cluster, [FromQuery] int page = 1, int pageSize = 16)
        {
            List<string> foundIds;
            long totalCount;

            // 1. Dùng RediSearch nếu có từ khóa search
            if (!string.IsNullOrWhiteSpace(search))
            {
                var (ids, total) = await _searchService.SearchAsync(search, cluster, page, pageSize);
                
                if (total != -1) {
                    foundIds = ids;
                    totalCount = total;
                }
                else {
                    // Fallback to LINQ search
                    var query = _csvData.Customers.Where(c => c.CustomerId.Contains(search, StringComparison.OrdinalIgnoreCase));
                    if (cluster.HasValue)
                    {
                        var clusterIds = _csvData.Segments.Where(s => s.Cluster == cluster.Value).Select(s => s.CustomerId).ToHashSet();
                        query = query.Where(c => clusterIds.Contains(c.CustomerId));
                    }
                    totalCount = query.Count();
                    foundIds = query.OrderByDescending(c => c.TotalSearch)
                        .Skip((page - 1) * pageSize)
                        .Take(pageSize)
                        .Select(c => c.CustomerId)
                        .ToList();
                }
            }
            else
            {
                // 2. Không search thì dùng LINQ như cũ cho cluster filter hoặc lấy all
                var query = _csvData.Customers.AsEnumerable();
                if (cluster.HasValue)
                {
                    var clusterIds = _csvData.Segments.Where(s => s.Cluster == cluster.Value).Select(s => s.CustomerId).ToHashSet();
                    query = query.Where(c => clusterIds.Contains(c.CustomerId));
                }
                
                totalCount = query.Count();
                foundIds = query.OrderByDescending(c => c.TotalSearch)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(c => c.CustomerId)
                    .ToList();
            }

            var data = foundIds.Select(id => {
                var c = _csvData.GetCustomer(id);
                var clusterId = _csvData.GetCluster(id);
                return new {
                    customerId = id,
                    totalSearch = c?.TotalSearch ?? 0,
                    cluster = clusterId,
                    segmentName = CsvDataService.GetSegmentName(clusterId),
                    topCategory = _csvData.GetTopCategoryForUser(id)
                };
            }).ToList();

            return Ok(new { data, totalCount, page, pageSize });
        }

        [HttpGet("platform-distribution")]
        public IActionResult GetPlatformDistribution()
        {
            var result = _csvData.FactSearchPlatformTrend;
            return Ok(result ?? new List<object>());
        }

        // ============================================================
        // --- CÁC ENDPOINT SEGMENTATION (GIỮ NGUYÊN VỊ TRÍ - ĐÃ THÊM REDIS) ---
        // ============================================================

        [HttpGet("cluster-summaries")]
        public IActionResult GetClusterSummaries()
        {
            var result = _csvData.ClusterSummaries.Select(s => new {
                cluster = s.Cluster,
                segmentName = CsvDataService.GetSegmentName(s.Cluster),
                totalUsers = s.TotalUsers,
                avgTotalSearch = s.AvgTotalSearch,
                avgUniqueKeywords = s.AvgUniqueKeywords,
                avgCategories = s.AvgCategories,
                avgSearchPerMonth = s.AvgSearchPerMonth,
                color = CsvDataService.GetClusterColor(s.Cluster)
            }).ToList();
            return Ok(result);
        }

        [HttpGet("segment-scatter")]
        public IActionResult GetSegmentScatter()
        {
            var result = _csvData.Segments
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
            return Ok(result);
        }

        [HttpGet("segment-insights")]
        public IActionResult GetSegmentInsights()
        {
            var result = new[]
            {
                new { cluster = 0, segmentName = CsvDataService.GetSegmentName(0), color = CsvDataService.GetClusterColor(0), title = "Core Value Users", text = "Người dùng hoạt động rất mạnh mẽ. Đây là nhóm khách hàng nòng cốt cần duy trì chiến lược giữ chân đặc biệt." },
                new { cluster = 1, segmentName = CsvDataService.GetSegmentName(1), color = CsvDataService.GetClusterColor(1), title = "Growing Potential", text = "Nhóm khách hàng sử dụng dịch vụ ở mức trung bình. Có tiềm năng chuyển đổi thành nhóm Highly Engaged." },
                new { cluster = 2, segmentName = CsvDataService.GetSegmentName(2), color = CsvDataService.GetClusterColor(2), title = "Targeted Interests", text = "Chỉ tập trung vào một vài thể loại nhất định. Cần đẩy mạnh gợi ý nội dung cùng sở thích." },
                new { cluster = 3, segmentName = CsvDataService.GetSegmentName(3), color = CsvDataService.GetClusterColor(3), title = "Re-engagement Needed", text = "Hoạt động thấp. Cần các chiến dịch khuyến mãi hoặc thông báo quay lại để giảm tỷ lệ rời bỏ." }
            };
            return Ok(result);
        }

        [HttpGet("segment-users")]
        public IActionResult GetSegmentUsers([FromQuery] string? search, [FromQuery] int? cluster, [FromQuery] int page = 1, int pageSize = 15)
        {
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

            return Ok(new { data, totalCount });
        }
    }
}