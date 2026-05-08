namespace Project_KHDL.Server.Models
{
    public class FactSearch
    {
        public string event_id { get; set; } = string.Empty;
        public string customer_id { get; set; } = string.Empty;
        public int? keyword_id { get; set; }
        public int? action_id { get; set; }
        public string event_time { get; set; } = string.Empty;
        public string platform { get; set; } = string.Empty;

        // Dùng double? vì CSV có giá trị "10.0" và có cả ô trống (null)
        public double? content_category_id { get; set; }
    }
}
