using Microsoft.AspNetCore.Mvc;
using Project_KHDL.Server.Services;
using Project_KHDL.Server.Models;

namespace Project_KHDL.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AlertController : ControllerBase
    {
        private readonly AlertService _alertService;

        public AlertController(AlertService alertService)
        {
            _alertService = alertService;
        }

        [HttpGet]
        public IActionResult GetAlerts()
        {
            return Ok(_alertService.GetActiveAlerts());
        }

        [HttpGet("health")]
        public IActionResult GetHealth()
        {
            return Ok(_alertService.GetHealthStatus());
        }

        [HttpPost("{id}/read")]
        public IActionResult MarkAsRead(string id)
        {
            _alertService.MarkAsRead(id);
            return Ok();
        }

        [HttpPost("refresh")]
        public IActionResult RefreshAlerts()
        {
            _alertService.GenerateAlerts();
            return Ok();
        }
    }
}
