using System;
using System.Collections.Generic;

namespace Project_KHDL.Server.Models
{
    public class SystemAlert
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Type { get; set; } = "Behavior"; // Behavior, System, Security
        public string Severity { get; set; } = "Medium"; // Low, Medium, High, Critical
        public string Title { get; set; } = "";
        public string Message { get; set; } = "";
        public DateTime Timestamp { get; set; } = DateTime.Now;
        public bool IsRead { get; set; } = false;
        public string? RelatedCustomerId { get; set; }
    }

    public class DataHealthStatus
    {
        public bool IsHealthy { get; set; }
        public string StatusMessage { get; set; } = "";
        public DateTime LastUpdate { get; set; }
        public int TotalRecords { get; set; }
        public List<string> SyncErrors { get; set; } = new();
    }
}
