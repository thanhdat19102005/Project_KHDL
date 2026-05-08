namespace Project_KHDL.Server.Models
{
    public class CustomerSearchMonthly
    {
        public string CustomerId { get; set; } = string.Empty;
        public string Month { get; set; } = string.Empty;
        public long SearchCount { get; set; }
    }
}
