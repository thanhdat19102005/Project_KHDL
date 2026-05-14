using Project_KHDL.Server.Models;
using System.Text;

namespace Project_KHDL.Server.Services
{
    public class AuditService
    {
        private readonly string _logFilePath;

        public AuditService()
        {
            var dataDir = Path.Combine(Directory.GetCurrentDirectory(), "Data", "Logs");
            if (!Directory.Exists(dataDir)) Directory.CreateDirectory(dataDir);
            _logFilePath = Path.Combine(dataDir, "audit_log.csv");

            // Create header if file doesn't exist
            if (!File.Exists(_logFilePath))
            {
                File.WriteAllText(_logFilePath, "Timestamp,Username,Action,Target,IPAddress\n", Encoding.UTF8);
            }
        }

        public async Task LogAction(string username, string action, string target, string ipAddress)
        {
            var logEntry = $"{DateTime.Now:yyyy-MM-dd HH:mm:ss},{username},{action},{target},{ipAddress}\n";
            await File.AppendAllTextAsync(_logFilePath, logEntry, Encoding.UTF8);
            Console.WriteLine($"[AUDIT] {username} performed {action} on {target}");
        }

        public async Task<List<AuditLog>> GetLogs()
        {
            var logs = new List<AuditLog>();
            if (!File.Exists(_logFilePath)) return logs;

            var lines = await File.ReadAllLinesAsync(_logFilePath);
            // Skip header
            foreach (var line in lines.Skip(1))
            {
                var parts = line.Split(',');
                if (parts.Length >= 5)
                {
                    logs.Add(new AuditLog
                    {
                        Timestamp = DateTime.Parse(parts[0]),
                        Username = parts[1],
                        Action = parts[2],
                        Target = parts[3],
                        IPAddress = parts[4]
                    });
                }
            }
            return logs.OrderByDescending(l => l.Timestamp).ToList();
        }
    }
}
