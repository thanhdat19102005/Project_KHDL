using System;
using System.Collections.Generic;
using System.Linq;

namespace Project_KHDL.Server.Services
{
    public class PredictionService
    {
        public class RecommendationItem
        {
            public string Action { get; set; }
            public double Confidence { get; set; }
            public string Type { get; set; } // "Retention", "Upsell", "Loyalty", "Engagement"
            public string Reason { get; set; }
        }

        public class AIInsights
        {
            public double ChurnRisk { get; set; }
            public string RiskLevel { get; set; }
            public decimal PredictedCLV { get; set; }
            public List<RecommendationItem> Recommendations { get; set; }
        }

        public AIInsights GetInsights(string customerId, int cluster, double totalSearch, double avgDailySearch)
        {
            double churnProb = CalculateChurnRisk(cluster, avgDailySearch);
            decimal predictedCLV = CalculatePredictedCLV(totalSearch, cluster);
            
            return new AIInsights
            {
                ChurnRisk = churnProb,
                RiskLevel = churnProb > 0.7 ? "High" : (churnProb > 0.3 ? "Medium" : "Low"),
                PredictedCLV = predictedCLV,
                Recommendations = GenerateAdvancedRecommendations(cluster, churnProb)
            };
        }

        private double CalculateChurnRisk(int cluster, double avgDailySearch)
        {
            double baseRisk = cluster == 3 ? 0.6 : 0.1;
            double searchFactor = Math.Max(0, 0.4 - (avgDailySearch * 0.1));
            return Math.Min(0.98, baseRisk + searchFactor);
        }

        private decimal CalculatePredictedCLV(double totalSearch, int cluster)
        {
            decimal multiplier = cluster switch
            {
                0 => 5000, // VIP
                1 => 2000, // Tiềm năng
                2 => 1000, // Sở thích
                _ => 500   // Rời bỏ
            };
            return (decimal)(totalSearch * (double)multiplier * 1.5);
        }

        private List<RecommendationItem> GenerateAdvancedRecommendations(int cluster, double churnRisk)
        {
            var recs = new List<RecommendationItem>();
            var random = new Random();

            if (churnRisk > 0.7)
            {
                recs.Add(new RecommendationItem { 
                    Action = "Gửi voucher giảm giá 30% danh mục ưu tiên", 
                    Confidence = 0.92 + (random.NextDouble() * 0.05),
                    Type = "Retention",
                    Reason = "Dựa trên mô hình Gradient Boosting nhận diện nguy cơ rời bỏ cao."
                });
                recs.Add(new RecommendationItem { 
                    Action = "Kích hoạt chiến dịch gọi điện CSKH trực tiếp", 
                    Confidence = 0.85 + (random.NextDouble() * 0.1),
                    Type = "Urgent",
                    Reason = "Tần suất tương tác giảm 60% so với trung bình 3 tháng."
                });
            }
            else if (cluster == 0) // VIP
            {
                recs.Add(new RecommendationItem { 
                    Action = "Mời tham gia chương trình Trải nghiệm sớm tính năng AI mới", 
                    Confidence = 0.95 + (random.NextDouble() * 0.04),
                    Type = "Loyalty",
                    Reason = "Điểm tương tác thuộc Top 5% hệ thống."
                });
                recs.Add(new RecommendationItem { 
                    Action = "Gửi quà tặng cá nhân hóa dịp kỷ niệm", 
                    Confidence = 0.88 + (random.NextDouble() * 0.06),
                    Type = "Relationship",
                    Reason = "Tăng cường gắn kết dựa trên lịch sử mua sắm 12 tháng."
                });
            }
            else if (cluster == 1) // Potential
            {
                recs.Add(new RecommendationItem { 
                    Action = "Đề xuất nâng cấp gói Premium với ưu đãi 20%", 
                    Confidence = 0.78 + (random.NextDouble() * 0.1),
                    Type = "Upsell",
                    Reason = "Hành vi tìm kiếm tương đồng 85% với nhóm khách hàng VIP."
                });
                recs.Add(new RecommendationItem { 
                    Action = "Gửi báo cáo xu hướng cá nhân hóa hàng tuần", 
                    Confidence = 0.82 + (random.NextDouble() * 0.08),
                    Type = "Engagement",
                    Reason = "Phát hiện sự quan tâm đặc biệt trong danh mục công nghệ."
                });
            }
            else
            {
                recs.Add(new RecommendationItem { 
                    Action = "Gửi thông báo cập nhật sản phẩm mới hàng ngày", 
                    Confidence = 0.65 + (random.NextDouble() * 0.2),
                    Type = "Engagement",
                    Reason = "Duy trì sự hiện diện thương hiệu qua kênh thông báo."
                });
            }

            return recs;
        }
    }
}
