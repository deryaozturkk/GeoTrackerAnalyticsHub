using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using GeoTracker.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace GeoTracker.Workers;

public class SpatialDataProcessor : BackgroundService
{
    private readonly ILogger<SpatialDataProcessor> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public SpatialDataProcessor(ILogger<SpatialDataProcessor> logger, IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("CBS Veri İşleyici (Worker) başlatıldı.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<GeoTrackerDbContext>();

                var unprocessedPoints = await dbContext.PointsOfInterest
                    .Where(p => !p.IsProcessed)
                    .OrderBy(p => p.CreatedAt)
                    .Take(10) // Her seferinde 10 kayıt al
                    .ToListAsync(stoppingToken);

                if (unprocessedPoints.Any())
                {
                    _logger.LogInformation($"{unprocessedPoints.Count} adet işlenmemiş veri bulundu. Analiz ediliyor...");

                    foreach (var point in unprocessedPoints)
                    {
                        await Task.Delay(500, stoppingToken); // İşlem yapıyormuş gibi beklet
                        point.IsProcessed = true;
                        _logger.LogInformation($"İşlendi: {point.Name}");
                    }
                    await dbContext.SaveChangesAsync(stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Bir hata oluştu!");
            }

            await Task.Delay(5000, stoppingToken); // 5 saniyede bir kontrol et
        }
    }
}