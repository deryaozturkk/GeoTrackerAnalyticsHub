using GeoTracker.Persistence.Contexts;
using GeoTracker.Workers;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Veritabanı bağlantısını ekle
builder.Services.AddDbContext<GeoTrackerDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Worker servisini (Arka plan görevini) API ile birlikte çalışması için ekle
builder.Services.AddHostedService<SpatialDataProcessor>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();