using GeoTracker.Application.Interfaces;
using GeoTracker.WebAPI.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace GeoTracker.WebAPI.Services;

public class MapNotificationService : IMapNotificationService
{
    private readonly IHubContext<MapHub> _hubContext;

    public MapNotificationService(IHubContext<MapHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyPointProcessedAsync(string pointId)
    {
        // Angular'daki dinleyiciye "PointProcessed" mesajını ve ID'sini gönder
        await _hubContext.Clients.All.SendAsync("PointProcessed", pointId);
    }
}