using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Project_KHDL.Server.Models;

namespace Project_KHDL.Server.Services
{
    public class ReportingService
    {
        private readonly CsvDataService _csvData;

        public ReportingService(CsvDataService csvData)
        {
            _csvData = csvData;
        }

        public string GenerateWeeklySummaryText()
        {
            var sb = new StringBuilder();
            sb.AppendLine("📊 BÁO CÁO PHÂN TÍCH KHÁCH HÀNG ĐỊNH KỲ");
            sb.AppendLine($"Ngày báo cáo: {DateTime.Now:dd/MM/yyyy}");
            sb.AppendLine("------------------------------------------");
            sb.AppendLine($"✅ Tổng số khách hàng: {_csvData.Customers.Count:N0}");
            sb.AppendLine($"✅ Tổng lượt tương tác: {_csvData.Customers.Sum(c => c.TotalSearch):N0}");
            
            var vipCount = _csvData.Segments.Count(s => s.Cluster == 0);
            sb.AppendLine($"💎 Nhóm VIP: {vipCount:N0} người");
            
            var churnRiskCount = _csvData.Segments.Count(s => s.Cluster == 3);
            sb.AppendLine($"⚠️ Nguy cơ rời bỏ: {churnRiskCount:N0} người");
            
            sb.AppendLine("\n🔥 Top 3 Danh mục tìm kiếm:");
            foreach (var cat in _csvData.TopCategories.Take(3))
            {
                sb.AppendLine($"- {cat.category_name}: {cat.total_search:N0} lượt ({cat.percentage}%)");
            }

            sb.AppendLine("\n🚀 Khuyến nghị hành động:");
            sb.AppendLine("1. Tăng cường chăm sóc đặc biệt cho nhóm VIP.");
            sb.AppendLine("2. Gửi chiến dịch Re-engagement cho nhóm Nguy cơ rời bỏ.");
            
            return sb.ToString();
        }

        public async Task SendReportToSlackAsync(string webhookUrl)
        {
            // Demo logic gửi Slack
            var text = GenerateWeeklySummaryText();
            Console.WriteLine($"[Slack Demo] Sending to {webhookUrl}:\n{text}");
            await Task.Delay(500);
        }

        public async Task SendReportToEmailAsync(string email)
        {
            // Demo logic gửi Email
            var text = GenerateWeeklySummaryText();
            Console.WriteLine($"[Email Demo] Sending to {email}:\n{text}");
            await Task.Delay(500);
        }

        public object GetAIForecast()
        {
            // Mô phỏng kết quả từ mô hình Time Series Forecasting (Prophet hoặc LSTM)
            var now = DateTime.Now;
            var forecast = new List<object>();
            var random = new Random();

            // Dự báo 30 ngày tới dựa trên xu hướng hiện tại
            for (int i = 0; i < 30; i++)
            {
                var date = now.AddDays(i);
                // Giả lập xu hướng tăng nhẹ với biến động nhiễu
                double baseValue = 500000 + (i * 2000); 
                double noise = random.Next(-10000, 10000);
                
                forecast.Add(new {
                    date = date.ToString("yyyy-MM-dd"),
                    actual = i == 0 ? 510000 : (object)null,
                    predicted = baseValue + noise,
                    lowerBound = baseValue + noise - 15000,
                    upperBound = baseValue + noise + 15000
                });
            }

            return new
            {
                forecastData = forecast,
                insights = new[] {
                    new { 
                        type = "Trend", 
                        title = "Dự báo tăng trưởng", 
                        text = "Dữ liệu dự báo cho thấy mức độ tìm kiếm sẽ tăng khoảng 8.5% trong 30 ngày tới nhờ vào các xu hướng phim Drama mới.",
                        confidence = 0.92
                    },
                    new { 
                        type = "Anomaly", 
                        title = "Phát hiện bất thường", 
                        text = "Hệ thống phát hiện một đợt sụt giảm nhẹ (Anomaly) vào ngày 20/05 do sự kiện bảo trì hệ thống định kỳ.",
                        confidence = 0.85
                    }
                },
                topPredictedCategories = new[] {
                    new { name = "Hành động", score = 0.95, trend = "Up" },
                    new { name = "Kinh dị", score = 0.88, trend = "Up" },
                    new { name = "Tài liệu", score = 0.45, trend = "Down" }
                }
            };
        }
    }
}
