using CsvHelper.Configuration.Attributes;

namespace Project_KHDL.Server.Models
{
    public class CustomerFeature
    {
        [Name("customer_id")] public string CustomerId { get; set; } = string.Empty;
        [Name("total_search")] public long TotalSearch { get; set; }
        [Name("unique_keyword_count")] public int UniqueKeywordCount { get; set; }
        [Name("total_categories")] public int TotalCategories { get; set; }
        [Name("avg_search_per_month")] public double AvgSearchPerMonth { get; set; }
        [Name("diversity_score")] public double DiversityScore { get; set; }
    }
}
