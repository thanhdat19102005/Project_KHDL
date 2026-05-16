using Microsoft.AspNetCore.Mvc;
using Project_KHDL.Server.Services;

namespace Project_KHDL.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportController : ControllerBase
    {
        private readonly ReportingService _reportingService;
        private readonly AuditService _auditService;

        public ReportController(ReportingService reportingService, AuditService auditService)
        {
            _reportingService = reportingService;
            _auditService = auditService;
        }

        [HttpGet("summary")]
        public IActionResult GetSummary()
        {
            return Ok(new { 
                text = _reportingService.GenerateWeeklySummaryText(),
                generatedAt = DateTime.Now
            });
        }

        [HttpGet("ai-forecast")]
        public IActionResult GetAIForecast()
        {
            return Ok(_reportingService.GetAIForecast());
        }

        [HttpPost("trigger-slack")]
        public async Task<IActionResult> TriggerSlack([FromBody] SlackRequest request)
        {
            await _reportingService.SendReportToSlackAsync(request.WebhookUrl);
            await _auditService.LogAction("Admin (Khang)", "Gửi báo cáo qua Slack", "Marketing Channel", Request.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown");
            return Ok(new { message = "Report sent to Slack successfully" });
        }

        [HttpPost("trigger-email")]
        public async Task<IActionResult> TriggerEmail([FromBody] EmailRequest request)
        {
            await _reportingService.SendReportToEmailAsync(request.Email);
            await _auditService.LogAction("Admin (Khang)", "Gửi báo cáo qua Email", request.Email, Request.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown");
            return Ok(new { message = "Report sent to Email successfully" });
        }

        [HttpGet("logs")]
        public async Task<IActionResult> GetLogs()
        {
            var logs = await _auditService.GetLogs();
            return Ok(logs);
        }
    }

    public class SlackRequest { public string WebhookUrl { get; set; } }
    public class EmailRequest { public string Email { get; set; } }
}
