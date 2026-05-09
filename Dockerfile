# 1. Temel Çalışma Zamanı
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# 2. Derleme Aşaması
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Proje dosyalarını kopyala (Sadece .csproj'ları önce kopyalamak Docker cache'i için best-practice'dir)
COPY ["src/Presentation/GeoTracker.WebAPI/GeoTracker.WebAPI.csproj", "src/Presentation/GeoTracker.WebAPI/"]
COPY ["src/Infrastructure/GeoTracker.Persistence/GeoTracker.Persistence.csproj", "src/Infrastructure/GeoTracker.Persistence/"]
COPY ["src/Infrastructure/GeoTracker.Workers/GeoTracker.Workers.csproj", "src/Infrastructure/GeoTracker.Workers/"]
COPY ["src/Core/GeoTracker.Application/GeoTracker.Application.csproj", "src/Core/GeoTracker.Application/"]
COPY ["src/Core/GeoTracker.Domain/GeoTracker.Domain.csproj", "src/Core/GeoTracker.Domain/"]

RUN dotnet restore "src/Presentation/GeoTracker.WebAPI/GeoTracker.WebAPI.csproj"

# Tüm kodları kopyala ve derle
COPY . .
WORKDIR "/src/src/Presentation/GeoTracker.WebAPI"
RUN dotnet build "GeoTracker.WebAPI.csproj" -c Release -o /app/build

# 3. Yayınlama (Publish) Aşaması
FROM build AS publish
RUN dotnet publish "GeoTracker.WebAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 4. Son Aşama (Çalıştırma)
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "GeoTracker.WebAPI.dll"]