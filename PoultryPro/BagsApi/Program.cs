using BagsApi.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Entity Framework
var connectionString = builder.Configuration.GetConnectionString("BagsConn") 
    ?? throw new InvalidOperationException("Connection string 'BagsConn' not found.");

builder.Services.AddDbContext<BagsDbContext>(options =>
    options.UseSqlServer(connectionString));

// Database services for products, orders, blog
builder.Services.AddScoped<BagsApi.Services.IProductService, BagsApi.Services.ProductService>();
builder.Services.AddScoped<BagsApi.Services.IOrderService, BagsApi.Services.OrderService>();
builder.Services.AddScoped<BagsApi.Services.IBlogService, BagsApi.Services.BlogService>();

// CORS Configuration: Allow configured origins from appsettings
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", corsBuilder =>
    {
        var allowedOrigins = new List<string>
        {
            "http://localhost:3000",
            "https://localhost:3000",
            "http://localhost:3001",
            "https://localhost:3001"
        };

        // Get production frontend URL from configuration
        var frontendBaseUrl = builder.Configuration["FrontendApp:BaseUrl"];
        if (!string.IsNullOrEmpty(frontendBaseUrl) && !allowedOrigins.Contains(frontendBaseUrl))
        {
            allowedOrigins.Add(frontendBaseUrl);
        }

        // Get additional allowed origins from configuration
        var additionalOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>();
        if (additionalOrigins != null && additionalOrigins.Length > 0)
        {
            foreach (var origin in additionalOrigins)
            {
                if (!string.IsNullOrEmpty(origin) && !allowedOrigins.Contains(origin))
                {
                    allowedOrigins.Add(origin);
                }
            }
        }

        // Use flexible origin checking to allow both configured origins and ngrok domains
        corsBuilder
            .SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrEmpty(origin))
                    return false;

                // Allow localhost in any environment
                if (origin.StartsWith("http://localhost:") || origin.StartsWith("https://localhost:"))
                    return true;

                // Allow configured origins
                if (allowedOrigins.Contains(origin))
                    return true;

                // Allow ngrok domains (useful for testing even in production)
                if (origin.Contains(".ngrok-free.app") || 
                    origin.Contains(".ngrok.io") || 
                    origin.Contains(".ngrok-free.dev") ||
                    origin.Contains(".ngrok.app"))
                    return true;

                return false;
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Always enable Swagger (UI at /swagger)
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthorization();

// Simple root endpoint so / returns 200 instead of 404
app.MapGet("/", () => Results.Ok("BagsApi is running"));

app.MapControllers();

app.Run();
