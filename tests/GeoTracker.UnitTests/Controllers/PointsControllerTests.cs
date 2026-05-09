using GeoTracker.Domain.Entities;
using GeoTracker.Persistence.Contexts;
using GeoTracker.WebAPI.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace GeoTracker.UnitTests.Controllers;

public class PointsControllerTests
{
    [Fact] // Bunun bir test metodu olduğunu belirtir
    public async Task GetAll_ReturnsOkResult_WithListOfPoints()
    {
        // 1. ARRANGE (Hazırlık)
        // RAM üzerinde sahte ve geçici bir test veritabanı ayarlıyoruz
        var options = new DbContextOptionsBuilder<GeoTrackerDbContext>()
            .UseInMemoryDatabase(databaseName: "GeoTrackerTestDb")
            .Options;

        // İçine test edebilmek için 2 tane sahte veri ekliyoruz
        using (var context = new GeoTrackerDbContext(options))
        {
            context.PointsOfInterest.Add(new PointOfInterest { Id = Guid.NewGuid(), Name = "Test Mekan 1", Latitude = 40.0, Longitude = 29.0 });
            context.PointsOfInterest.Add(new PointOfInterest { Id = Guid.NewGuid(), Name = "Test Mekan 2", Latitude = 41.0, Longitude = 28.0 });
            context.SaveChanges();
        }

        // Test edeceğimiz Controller'ı bu sahte veritabanı ile ayağa kaldırıyoruz
        using (var context = new GeoTrackerDbContext(options))
        {
            var controller = new PointsController(context);

            // 2. ACT (Eylem)
            // Sanki bir kullanıcı API'ye istek atmış gibi GetAll metodunu çağırıyoruz
            var result = await controller.GetAll();

            // 3. ASSERT (Doğrulama)
            // Dönüş tipi '200 OK' mu?
            var okResult = Assert.IsType<OkObjectResult>(result);
            
            // Dönen veri gerçekten bir PointOfInterest listesi mi?
            var points = Assert.IsAssignableFrom<IEnumerable<PointOfInterest>>(okResult.Value);
            
            // Listede tam olarak eklediğimiz 2 tane veri mi var?
            Assert.Equal(2, points.Count());
        }
    }
}