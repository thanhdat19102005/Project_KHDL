using CsvHelper.Configuration.Attributes;

namespace Project_KHDL.Server.Models
{
    public class CustomerSegment
    {
        [Name("customer_id")] public string CustomerId { get; set; } = string.Empty;
        [Name("cluster")] public int Cluster { get; set; }
    }
}
