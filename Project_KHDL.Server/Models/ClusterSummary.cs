namespace Project_KHDL.Server.Models
{
    public class ClusterSummary
    {
        public int Cluster { get; set; }
        public string SegmentName { get; set; } = string.Empty; // Mapping Layer
        public int TotalUsers { get; set; }
        public double AvgTotalSearch { get; set; }
        public double AvgUniqueKeywords { get; set; }
        public double AvgCategories { get; set; }
        public double AvgSearchPerMonth { get; set; }
        public string Color { get; set; } = string.Empty;
        public string Label { get; internal set; }
    }
}
