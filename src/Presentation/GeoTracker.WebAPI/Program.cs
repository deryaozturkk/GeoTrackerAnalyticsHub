using GeoTracker.Persistence.Contexts;
using GeoTracker.Workers;
using Microsoft.EntityFrameworkCore;
using GeoTracker.Application.Interfaces;
using GeoTracker.WebAPI.Services;
using GeoTracker.WebAPI.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Veritabanı bağlantısını ekle
builder.Services.AddDbContext<GeoTrackerDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Worker servisini (Arka plan görevini) API ile birlikte çalışması için ekle
builder.Services.AddHostedService<SpatialDataProcessor>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

builder.Services.AddSingleton<IMapNotificationService, MapNotificationService>();

// Angular'a CORS izni veriyoruz
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200") // Sadece Angular'ın adresine izin ver
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAngular"); // CORS'u aktif et

app.UseAuthorization();

app.MapControllers();
app.MapHub<MapHub>("/maphub"); 


app.Run();