using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using Project_KHDL.Server.Models;
using Project_KHDL.Server.Services;
using System.Text.Json;

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
            // Try to get from cache (Redis), fallback gracefully if unavailable
            try
            {
                var cachedData = await _cache.GetStringAsync(cacheKey);
                if (!string.IsNullOrEmpty(cachedData))
                {
                    return JsonSerializer.Deserialize<T>(cachedData)!;
                }
            }
            catch
            {
                // Redis unavailable - skip cache, compute directly
                return getDataFunc()!;
            }

            var data = getDataFunc();
            if (data != null)
            {
                try
                {
                    var jsonData = JsonSerializer.Serialize(data);
                    await _cache.SetStringAsync(cacheKey, jsonData, _cacheOptions);
                }
                catch
                {
                    // Redis write failed - still return data
                }
            }
            return data!;
        }

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
            // SỬA LỖI MAPPING: Phải select ra Object có tên trường viết thường
            var result = await GetOrSetCacheAsync<List<object>>("Dash_Keywords_V_PRO_1", () =>
                _csvData.TopKeywords.OrderByDescending(k => k.SearchCount).Take(20)
                .Select(k => new { keyword = k.Keyword, searchCount = k.SearchCount })
                .Cast<object>().ToList());
            return Ok(result ?? new List<object>());
        }

        [HttpGet("segments")]
        public async Task<IActionResult> GetSegments()
        {
            var result = await GetOrSetCacheAsync<List<SegmentSummary>>("Dash_SegmentsSummary_V_PRO_1", () =>
            {
                var clusters = new[] { 0, 1, 2 };
                var names = new[] { "VIP", "Churn Risk", "Inactive" };
                var colors = new[] { "green", "orange", "gray" };

                return clusters.Select((c, i) => new SegmentSummary
                {
                    cluster = c,
                    name = names[i],
                    color = colors[i],
                    totalUsers = _csvData.Segments.Count(s => s.Cluster == c),
                    totalSearch = _csvData.Customers.Where(cu =>
                        _csvData.Segments.Any(s => s.Cluster == c && s.CustomerId == cu.CustomerId)).Sum(u => u.TotalSearch)
                }).ToList();
            });
            return Ok(result ?? new List<SegmentSummary>());
        }

        [HttpGet("top-categories")]
        public async Task<IActionResult> GetTopCategories()
        {
            // SỬA LỖI MAPPING: Phải trả về trường viết thường khớp với Frontend
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
            return Ok(await GetOrSetCacheAsync($"UserDetail_{id}_V_PRO_1", () => {
                var customer = _csvData.Customers.FirstOrDefault(c => c.CustomerId == id);
                if (customer == null) return null;

                return new
                {
                    customerId = customer.CustomerId,
                    totalSearch = customer.TotalSearch,
                    cluster = _csvData.Segments.FirstOrDefault(s => s.CustomerId == id)?.Cluster ?? 2,
                    topKeyword = _csvData.GetTopKeywordForUser(id),
                    topCategory = _csvData.GetTopCategoryForUser(id)
                };
            }));
        }

        [HttpGet("users/{id}/insight")]
        public async Task<IActionResult> GetUserInsight(string id)
        {
            return Ok(await GetOrSetCacheAsync($"UserInsight_{id}_V_PRO_CHOT", () => {
                var customer = _csvData.Customers.FirstOrDefault(c => c.CustomerId == id);
                if (customer == null) return null;

                var cluster = _csvData.Segments.FirstOrDefault(s => s.CustomerId == id)?.Cluster ?? 2;
                var activeCustomers = _csvData.Customers.Where(c => c.TotalSearch > 0).ToList();
                var avgSearch = activeCustomers.Count > 0 ? activeCustomers.Average(c => c.TotalSearch) : 0;

                string behavior, meaning, action;

                if (cluster == 0)
                {
                    behavior = $"Hành vi: Khách hàng VIP với {customer.TotalSearch:N0} lượt tìm kiếm; mức độ tương tác cao vượt trội so với trung bình hệ thống ({avgSearch:N0}).";
                    meaning = "Ý nghĩa: Đây là nhóm khách hàng cốt lõi, đóng góp giá trị lớn nhất cho nền tảng và có độ trung thành cao.";
                    action = "Hành động: Duy trì chăm sóc đặc biệt qua các chương trình triân, ưu đãi độc quyền và cá nhân hóa trải nghiệm.";
                }
                else if (cluster == 1)
                {
                    behavior = $"Hành vi: Khách hàng có dấu hiệu rời bỏ với {customer.TotalSearch:N0} lượt tìm kiếm; mức độ sử dụng đang giảm dần.";
                    meaning = "Ý nghĩa: Nhóm này có nguy cơ ngừng sử dụng dịch vụ nếu không có sự tác động kịp thời.";
                    action = "Hành động: Gửi thông báo nhắc hẹn, gợi ý nội dung mới và thực hiện khảo sát hài lòng.";
                }
                else
                {
                    behavior = $"Hành vi: Khách hàng không hoạt động ({customer.TotalSearch:N0} lượt tìm kiếm).";
                    meaning = "Ý nghĩa: Nền tảng chưa đáp ứng được nhu cầu hoặc người dùng chưa làm quen được giao diện.";
                    action = "Hành động: Gửi email hướng dẫn sử dụng, tặng mã kích hoạt để khuyến khích quay lại.";
                }

                return new { cluster, behavior, meaning, action };
            }));
        }

        [HttpGet("users")]
        public IActionResult GetUsers([FromQuery] string? search, [FromQuery] int? cluster, [FromQuery] int page = 1, int pageSize = 16)
        {
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
                .Select(c => new {
                    customerId = c.CustomerId,
                    totalSearch = c.TotalSearch,
                    cluster = _csvData.Segments.FirstOrDefault(s => s.CustomerId == c.CustomerId)?.Cluster ?? 2,
                    topCategory = _csvData.GetTopCategoryForUser(c.CustomerId)
                }).ToList();

            return Ok(new { data, totalCount, page, pageSize });
        }

        [HttpGet("platform-distribution")]
        public async Task<IActionResult> GetPlatformDistribution()
        {
            // Đổi Key từ "Dash_Platform_V1" thành "Dash_Platform_FULL_FINAL" để ép nó nạp lại dữ liệu
            var result = await GetOrSetCacheAsync<List<object>>("Dash_Platform_FULL_FINAL", () =>
            {
                return _csvData.FactSearchPlatformTrend;
            });
            return Ok(result ?? new List<object>());
        }









    }
}