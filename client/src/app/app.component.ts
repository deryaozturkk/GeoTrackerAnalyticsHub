import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';

const iconDefault = L.icon({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private map!: L.Map;
  
  // Angular 17'nin yeni inject() metodu ile HttpClient'i içeri alıyoruz
  private http = inject(HttpClient); 

  ngOnInit(): void {
    this.initMap();
    this.loadPointsFromBackend(); // Harita yüklenir yüklenmez C#'a bağlan!
  }

  private initMap(): void {
    this.map = L.map('map').setView([40.1828, 29.0669], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // YENİ EKLENEN KISIM: Haritaya tıklandığında ne olacak?
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      this.savePointToDatabase(lat, lng); // Tıklanan koordinatları backend'e gönder
    });
  }

  private loadPointsFromBackend(): void {
    // C# API'mizin çalıştığı port (5184)
    const apiUrl = 'http://localhost:5184/api/points';

    this.http.get<any[]>(apiUrl).subscribe({
      next: (points) => {
        console.log("C#'tan Gelen Veriler:", points);
        
        // Gelen verileri dön ve her biri için haritaya bir işaretçi (Marker) koy
        points.forEach(p => {
          L.marker([p.latitude, p.longitude])
            .addTo(this.map)
            .bindPopup(`<b>${p.name}</b><br>İşlendi mi: ${p.isProcessed}`);
        });
      },
      error: (err) => {
        console.error("Veri çekilirken bir hata oluştu:", err);
      }
    });
  }

  private savePointToDatabase(lat: number, lng: number): void {
    const apiUrl = 'http://localhost:5184/api/points';
    
    // C# tarafındaki PointOfInterest sınıfımızın beklediği model
    const newPoint = {
      name: `Tıklanan Konum (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
      latitude: lat,
      longitude: lng,
      isProcessed: false // Yeni eklendiği için henüz işlenmedi
    };

    // Angular HTTP POST isteği
    this.http.post(apiUrl, newPoint).subscribe({
      next: (savedPoint: any) => {
        console.log("Veritabanına başarıyla kaydedildi!", savedPoint);
        
        // Kayıt başarılıysa, pini anında haritaya ekle ve bilgi kutusunu aç
        L.marker([lat, lng])
          .addTo(this.map)
          .bindPopup(`<b>${savedPoint.name}</b><br>Yeni eklendi!`)
          .openPopup();
      },
      error: (err) => {
        console.error("Konum kaydedilirken hata oluştu:", err);
      }
    });
  }
}