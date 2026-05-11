import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import * as signalR from '@microsoft/signalr';

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

export interface PointOfInterest {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  isProcessed: boolean;
  aiRiskScore?: number; 
  aiAnalysis?: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private map!: L.Map;
  
  private http = inject(HttpClient); 

  private hubConnection!: signalR.HubConnection;

  ngOnInit(): void {
    this.initMap();
    this.loadPointsFromBackend(); // Harita yüklenir yüklenmez noktaları çek
    this.startSignalRConnection(); // SignalR dinlemeyi başlat
  }

  private startSignalRConnection(): void {
    // Backend'deki adrese (Hub) bağlan
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5184/maphub') 
      .build();

    // Bağlantıyı başlat
    this.hubConnection
      .start()
      .then(() => console.log('📡 SignalR Bağlantısı Başarıyla Kuruldu!'))
      .catch(err => console.error('SignalR Bağlantı Hatası:', err));

    // Backend'den (Worker'dan) gelen "PointProcessed" mesajını dinle!
    this.hubConnection.on('PointProcessed', (pointId: string) => {
      console.log(`⚡ CANLI BİLGİ: ${pointId} ID'li nokta arka planda işlendi!`);
      
      // Veri işlendiğine göre haritadaki tüm verileri YENİLEMEDEN tekrar çek!
      this.loadPointsFromBackend(); 
    });
  }

  private initMap(): void {
    this.map = L.map('map').setView([40.1828, 29.0669], 12); // Bursa merkezli başlar

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Haritaya tıklandığında ne olacak?
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      this.savePointToDatabase(lat, lng); // Tıklanan koordinatları backend'e gönder
    });
  }

  private loadPointsFromBackend(): void {
    const apiUrl = 'http://localhost:5184/api/points';

    // Noktaları çekerken PointOfInterest modelini kullanıyoruz
    this.http.get<PointOfInterest[]>(apiUrl).subscribe({ 
      next: (points) => {
        
        console.log("🔄 Veritabanından Güncel Liste Alındı:", points);

        // Haritadaki eski marker'ları temizleyelim ki üst üste binmesinler
        this.map.eachLayer((layer) => {
          if (layer instanceof L.Marker) {
            this.map.removeLayer(layer);
          }
        });

        // Gelen verileri dön ve her biri için haritaya bir işaretçi koy
        points.forEach(p => {
          const popupContent = this.generatePopupHtml(p); 
          
          L.marker([p.latitude, p.longitude])
            .addTo(this.map)
            .bindPopup(popupContent);
        });
      },
      error: (err) => {
        console.error("Veri çekilirken bir hata oluştu:", err);
      }
    });
  }

  private savePointToDatabase(lat: number, lng: number): void {
    const apiUrl = 'http://localhost:5184/api/points';
    
    const newPoint = {
      name: `Tıklanan Konum (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
      latitude: lat,
      longitude: lng,
      isProcessed: false 
    };

    this.http.post(apiUrl, newPoint).subscribe({
      next: (savedPoint: any) => {
        console.log("Veritabanına başarıyla kaydedildi!", savedPoint);
        
        // Kayıt başarılıysa, pini anında haritaya ekle ve bekliyor yazısını aç
        L.marker([lat, lng])
          .addTo(this.map)
          .bindPopup(`<b>${savedPoint.name}</b><br>⏳ Yapay Zeka analiz ediyor...`)
          .openPopup();
      },
      error: (err) => {
        console.error("Konum kaydedilirken hata oluştu:", err);
      }
    });
  }

  // Risk skoruna göre renklendirme hazırlayan popup
  private generatePopupHtml(p: PointOfInterest): string {
    const statusIcon = p.isProcessed ? '✅' : '⏳';
    const statusText = p.isProcessed ? 'İşlendi' : 'Analiz Bekliyor';
    
    // AI verisi varsa göster, yoksa "Analiz ediliyor" de
    const aiSection = p.aiRiskScore 
      ? `
        <hr style="margin: 8px 0; border: 0; border-top: 1px solid #eee;">
        <div style="color: #444;">
          <b style="color: #2c3e50;">🤖 AI Analiz Raporu:</b><br>
          <span style="font-size: 13px;">Risk Skoru: 
            <b style="color: ${p.aiRiskScore > 70 ? '#e74c3c' : '#27ae60'};">
              %${p.aiRiskScore}
            </b>
          </span><br>
          <p style="margin-top: 5px; font-style: italic; font-size: 12px; color: #7f8c8d;">
            "${p.aiAnalysis}"
          </p>
        </div>`
      : `<br><i style="color: #95a5a6; font-size: 12px;">🤖 Yapay zeka analiz ediyor...</i>`;

    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 5px;">
        <b style="font-size: 15px; color: #2c3e50;">📍 ${p.name}</b><br>
        <span style="font-size: 12px; color: #7f8c8d;">Durum: ${statusIcon} ${statusText}</span>
        ${aiSection}
      </div>
    `;
  }
}