namespace Project_KHDL.Server.Models
{
    public class User
    {
        public string Username { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty; // Admin, Marketer, Analyst
        public string DisplayName { get; set; } = string.Empty;
        public string Avatar { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class LoginResponse
    {
        public string Token { get; set; } = string.Empty;
        public User User { get; set; } = new();
    }
}
