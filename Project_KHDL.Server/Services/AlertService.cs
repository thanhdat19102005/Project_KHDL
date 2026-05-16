using System;
using System.Collections.Generic;
using System.Linq;
using Project_KHDL.Server.Models;

namespace Project_KHDL.Server.Services
{
    public class AlertService
    {
        private readonly CsvDataService _csvData;
        private List<SystemAlert> _alerts = new();
        private readonly int _maxAlerts = 50;

        public AlertService(CsvDataService csvData)
        {
            _csvData = csvData;
            // Khởi tạo một số cảnh báo mẫu dựa trên dữ liệu thực tế
            GenerateAlerts();
        }

        public List<SystemAlert> GetActiveAlerts() => _alerts.OrderByDescending(a => a.Timestamp).ToList();

        public void MarkAsRead(string id)
        {
            var alert = _alerts.FirstOrDefault(a => a.Id == id);
            if (alert != null) alert.IsRead = true;
        }

        public DataHealthStatus GetHealthStatus()
        {
            var errors = new List<string>();
            bool isHealthy = true;
            string message = "Hệ thống hoạt động bình thường";

            // Kiểm tra độ trễ dữ liệu (ví dụ: dữ liệu phải được cập nhật trong vòng 48h)
            var delay = DateTime.Now - _csvData.LoadedAt;
            if (delay.TotalHours > 48)
            {
                isHealthy = false;
                message = "Dữ liệu bị trễ";
                errors.Add($"Dữ liệu DE Pipeline chưa cập nhật trong {Math.Round(delay.TotalHours)} giờ qua.");
            }

            if (_csvData.Customers.Count == 0)
            {
                isHealthy = false;
                message = "Lỗi nạp dữ liệu";
                errors.Add("Không tìm thấy dữ liệu khách hàng trong file CSV.");
            }

            return new DataHealthStatus
            {
                IsHealthy = isHealthy,
                StatusMessage = message,
                LastUpdate = _csvData.LoadedAt,
                TotalRecords = _csvData.Customers.Count,
                SyncErrors = errors
            };
        }

        public void GenerateAlerts()
        {
            _alerts.Clear();

            // 1. Cảnh báo VIP sụt giảm tương tác
            var vips = _csvData.Segments.Where(s => s.Cluster == 0).Select(s => s.CustomerId).ToList();
            foreach (var vipId in vips.Take(10)) // Quét thử 10 VIP
            {
                var monthly = _csvData.SearchMonthly
                    .Where(s => s.CustomerId == vipId)
                    .OrderByDescending(s => s.Month)
                    .ToList();

                if (monthly.Count >= 2)
                {
                    var latest = monthly[0].SearchCount;
                    var previous = monthly[1].SearchCount;

                    // Nếu giảm hơn 60% so với tháng trước
                    if (latest < previous * 0.4 && previous > 5)
                    {
                        _alerts.Add(new SystemAlert
                        {
                            Type = "Behavior",
                            Severity = "Critical",
                            Title = "VIP Churn Alert",
                            Message = $"Khách hàng VIP #{vipId} giảm {Math.Round((1 - (double)latest/previous)*100)}% tương tác trong tháng này.",
                            RelatedCustomerId = vipId,
                            Timestamp = DateTime.Now.AddMinutes(-new Random().Next(10, 120))
                        });
                    }
                }
            }

            // 2. Cảnh báo hệ thống (Dữ liệu)
            var health = GetHealthStatus();
            if (!health.IsHealthy)
            {
                _alerts.Add(new SystemAlert
                {
                    Type = "System",
                    Severity = "High",
                    Title = "Data Pipeline Latency",
                    Message = health.StatusMessage,
                    Timestamp = DateTime.Now.AddHours(-1)
                });
            }

            // 3. Một số thông báo mặc định để demo UI
            _alerts.Add(new SystemAlert {
                Type = "Behavior",
                Severity = "Medium",
                Title = "Nhu cầu mới phát hiện",
                Message = "Có sự gia tăng tìm kiếm đột biến ở danh mục 'Thời trang' từ nhóm Potential.",
                Timestamp = DateTime.Now.AddMinutes(-45)
            });

            if (_alerts.Count > _maxAlerts)
                _alerts = _alerts.Take(_maxAlerts).ToList();
        }
    }
}
