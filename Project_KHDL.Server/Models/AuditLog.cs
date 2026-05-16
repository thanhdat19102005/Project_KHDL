using System;

namespace Project_KHDL.Server.Models
{
    public class AuditLog
    {
        public DateTime Timestamp { get; set; } = DateTime.Now;
        public string Username { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty; // View, Export, Delete
        public string Target { get; set; } = string.Empty; // CustomerId or PageName
        public string IPAddress { get; set; } = string.Empty;
    }
}
