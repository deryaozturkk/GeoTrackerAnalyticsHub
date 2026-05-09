using GeoTracker.Domain.Entities;
using GeoTracker.Persistence.Contexts;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GeoTracker.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PointsController : ControllerBase
{
    private readonly GeoTrackerDbContext _dbContext;

    public PointsController(GeoTrackerDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpPost]
    public async Task<IActionResult> Create(PointOfInterest point)
    {
        _dbContext.PointsOfInterest.Add(point);
        await _dbContext.SaveChangesAsync();
        return Ok(point);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var points = await _dbContext.PointsOfInterest.ToListAsync();
        return Ok(points);
    }
}