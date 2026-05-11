using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using GeoTracker.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using GeoTracker.Application.Interfaces; 

namespace GeoTracker.Workers;

public class SpatialDataProcessor : BackgroundService
{
    private readonly ILogger<SpatialDataProcessor> _logger;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IMapNotificationService _notificationService; 

    public SpatialDataProcessor(
        ILogger<SpatialDataProcessor> logger,
        IServiceScopeFactory scopeFactory, 
        IMapNotificationService notificationService)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
        _notificationService = notificationService;
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
                    .Take(10) // Bir seferde 10 veri işleyelim
                    .ToListAsync(stoppingToken);

                if (unprocessedPoints.Any())
                {
                    _logger.LogInformation($"{unprocessedPoints.Count} adet işlenmemiş veri bulundu. Analiz ediliyor...");

                    foreach (var point in unprocessedPoints)
                    {
                        await Task.Delay(500, stoppingToken); // İşlem yapıyormuş gibi beklet
                        point.IsProcessed = true;
                        _logger.LogInformation($"İşlendi: {point.Name}");
                        
                        // Veri işlendiği an Angular'a haber ver!
                        await _notificationService.NotifyPointProcessedAsync(point.Id.ToString());
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