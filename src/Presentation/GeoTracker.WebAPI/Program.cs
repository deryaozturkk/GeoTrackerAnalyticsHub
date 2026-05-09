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

// Angular'a CORS izni veriyoruz
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200") // Sadece Angular'ın adresine izin ver
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAngular"); // CORS'u aktif et

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();