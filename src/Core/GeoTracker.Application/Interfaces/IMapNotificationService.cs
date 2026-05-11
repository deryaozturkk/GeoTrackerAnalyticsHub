namespace GeoTracker.Application.Interfaces;

public interface IMapNotificationService
{
    Task NotifyPointProcessedAsync(string pointId);
}