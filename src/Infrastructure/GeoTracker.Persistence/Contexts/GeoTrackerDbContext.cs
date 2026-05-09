using GeoTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GeoTracker.Persistence.Contexts;

public class GeoTrackerDbContext : DbContext
{
    public GeoTrackerDbContext(DbContextOptions<GeoTrackerDbContext> options) : base(options)
    {
    }

    public DbSet<PointOfInterest> PointsOfInterest { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // İsim alanı zorunlu ve maksimum 150 karakter olsun
        modelBuilder.Entity<PointOfInterest>().Property(e => e.Name).IsRequired().HasMaxLength(150);
    }
}