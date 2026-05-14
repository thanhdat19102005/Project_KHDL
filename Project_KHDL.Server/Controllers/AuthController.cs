using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Project_KHDL.Server.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Project_KHDL.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public AuthController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            // Simple logic for enterprise demo
            User? user = null;

            if (request.Username == "admin" && request.Password == "admin123")
            {
                user = new User { Username = "admin", Role = "Admin", DisplayName = "Hệ thống Admin", Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" };
            }
            else if (request.Username == "marketer" && request.Password == "market123")
            {
                user = new User { Username = "marketer", Role = "Marketer", DisplayName = "Marketing Manager", Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Marketer" };
            }
            else if (request.Username == "analyst" && request.Password == "analyst123")
            {
                user = new User { Username = "analyst", Role = "Analyst", DisplayName = "Data Analyst", Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Analyst" };
            }

            if (user == null)
            {
                return Unauthorized(new { message = "Sai tài khoản hoặc mật khẩu" });
            }

            var token = GenerateJwtToken(user);

            return Ok(new LoginResponse
            {
                Token = token,
                User = user
            });
        }

        private string GenerateJwtToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("SuperSecretKeyForEnterpriseProjectKHDL2024"));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("DisplayName", user.DisplayName)
            };

            var token = new JwtSecurityToken(
                issuer: "ProjectKHDL",
                audience: "ProjectKHDLUsers",
                claims: claims,
                expires: DateTime.Now.AddHours(8),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
