using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Project_KHDL.Server.Services;

namespace Project_KHDL.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuditController : ControllerBase
    {
        private readonly AuditService _auditService;

        public AuditController(AuditService auditService)
        {
            _auditService = auditService;
        }

        [HttpPost("log")]
        public async Task<IActionResult> LogAction([FromBody] LogActionRequest request)
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            await _auditService.LogAction(request.Username, request.Action, request.Target, ipAddress);
            return Ok();
        }

        [HttpGet("logs")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetLogs()
        {
            var logs = await _auditService.GetLogs();
            return Ok(logs);
        }
    }

    public class LogActionRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string Target { get; set; } = string.Empty;
    }
}
