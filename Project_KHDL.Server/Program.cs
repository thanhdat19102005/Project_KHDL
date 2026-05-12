using Project_KHDL.Server.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSingleton<CsvDataService>();
builder.Services.AddSingleton<RediSearchService>();

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
app.UseAuthorization();
app.MapControllers();

app.Run();
