using Project_KHDL.Server.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSingleton<CsvDataService>();
builder.Services.AddSingleton<RediSearchService>();
builder.Services.AddSingleton<AuditService>();
builder.Services.AddSingleton<PredictionService>();
builder.Services.AddSingleton<AlertService>();
builder.Services.AddSingleton<ReportingService>();

// Cấu hình Authentication JWT
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = "ProjectKHDL",
        ValidAudience = "ProjectKHDLUsers",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("SuperSecretKeyForEnterpriseProjectKHDL2024"))
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});



// Cấu hình Redis Cache
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = "localhost:6379";
});

var app = builder.Build();

// Trigger CsvDataService initialization
try 
{
    using (var scope = app.Services.CreateScope())
    {
        _ = scope.ServiceProvider.GetRequiredService<CsvDataService>();
    }
}
catch (Exception ex)
{
    Console.WriteLine($"[FATAL] Failed to initialize CsvDataService: {ex.Message}");
    if (ex.InnerException != null) Console.WriteLine($"[INNER] {ex.InnerException.Message}");
    Console.WriteLine(ex.StackTrace);
}


app.UseCors("AllowAll");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
