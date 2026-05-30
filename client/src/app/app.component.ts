import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import * as signalR from '@microsoft/signalr';

// Leaflet varsayılan ikon ayarları
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
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private map!: L.Map;
  private http = inject(HttpClient); 
  private hubConnection!: signalR.HubConnection;

  // Performans Optimizasyonu: Haritadaki işaretçileri (marker) ID'lerine göre hafızada tutuyoruz
  private markersMap = new Map<string, L.Marker>();

  ngOnInit(): void {
    this.initMap();
    this.loadPointsFromBackend(); 
    this.startSignalRConnection(); 
  }

  private startSignalRConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5184/maphub') 
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('📡 SignalR Bağlantısı Başarıyla Kuruldu!'))
      .catch(err => console.error('SignalR Bağlantı Hatası:', err));

    // Backend'den gelen C# metodunu dinle (PointProcessed veya NotifyPointProcessed)
    const handleAiUpdate = (pointId: string) => {
      console.log(`⚡ CANLI BİLGİ: ${pointId} ID'li nokta arka planda işlendi!`);
      this.updateSingleMarker(pointId); 
    };

    // İki olası metot ismini de dinliyoruz (Garanti çözüm)
    this.hubConnection.on('PointProcessed', handleAiUpdate);
    this.hubConnection.on('NotifyPointProcessed', handleAiUpdate);
  }

  private initMap(): void {
    this.map = L.map('map').setView([40.1828, 29.0669], 12); // Bursa merkezli

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      this.savePointToDatabase(lat, lng); 
    });
  }

  private loadPointsFromBackend(): void {
    const apiUrl = 'http://localhost:5184/api/points';

    this.http.get<PointOfInterest[]>(apiUrl).subscribe({ 
      next: (points) => {
        console.log("🔄 Veritabanından Güncel Liste Alındı:", points);

        // Eski marker'ları temizle
        this.markersMap.forEach(marker => this.map.removeLayer(marker));
        this.markersMap.clear();

        // Haritaya ekle ve Map'e kaydet
        points.forEach(p => {
          const marker = L.marker([p.latitude, p.longitude])
            .addTo(this.map)
            .bindPopup(this.generatePopupHtml(p));
          
          this.markersMap.set(p.id, marker);
        });
      },
      error: (err) => console.error("Veri çekilirken hata:", err)
    });
  }

  // SADECE güncellenen noktayı çeker ve sadece onun Popup'ını günceller
  private updateSingleMarker(pointId: string): void {
    const apiUrl = 'http://localhost:5184/api/points';

    this.http.get<PointOfInterest[]>(apiUrl).subscribe({
      next: (points) => {
        const updatedPoint = points.find(p => p.id === pointId);
        
        if (updatedPoint) {
          const marker = this.markersMap.get(pointId);
          
          if (marker) {
            // Popup içeriğini Gemini verisiyle güncelle ve otomatik olarak AÇ!
            const newContent = this.generatePopupHtml(updatedPoint);
            marker.setPopupContent(newContent).openPopup();
          }
        }
      },
      error: (err) => console.error("Tekil veri güncellenirken hata:", err)
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

    this.http.post<PointOfInterest>(apiUrl, newPoint).subscribe({
      next: (savedPoint) => {
        console.log("Veritabanına başarıyla kaydedildi!", savedPoint);
        
        // Yeni pini anında haritaya ekle ve "Bekleniyor" popup'ını aç
        const marker = L.marker([lat, lng])
          .addTo(this.map)
          .bindPopup(this.generatePopupHtml(savedPoint))
          .openPopup();

        // SignalR geldiğinde bulabilmemiz için Map'e ekle
        if (savedPoint.id) {
          this.markersMap.set(savedPoint.id, marker);
        }
      },
      error: (err) => console.error("Konum kaydedilirken hata:", err)
    });
  }

  // Modern, renkli ve profesyonel Popup HTML Üretici
  private generatePopupHtml(p: PointOfInterest): string {
    const statusIcon = p.isProcessed ? '✅' : '⏳';
    const statusText = p.isProcessed ? 'İşlendi' : 'Analiz Bekliyor';
    
    // Risk skoruna göre dinamik renk belirleme
    let scoreColor = '#10B981'; // Güvenli (Yeşil)
    if (p.aiRiskScore !== undefined) {
        if (p.aiRiskScore > 70) scoreColor = '#EF4444'; // Yüksek Risk (Kırmızı)
        else if (p.aiRiskScore > 40) scoreColor = '#F59E0B'; // Orta Risk (Turuncu)
    }

    const aiSection = p.isProcessed && p.aiRiskScore !== undefined
      ? `
        <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 10px 0;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 12px; font-weight: 600; color: #4B5563; margin-right: 6px;">AI Risk Skoru:</span>
          <span style="background-color: ${scoreColor}; color: white; padding: 2px 8px; font-size: 12px; font-weight: 700; border-radius: 12px;">
            %${p.aiRiskScore}
          </span>
        </div>
        <p style="margin: 0; font-size: 12px; color: #374151; background: #F3F4F6; padding: 8px; border-radius: 6px; border-left: 3px solid #3B82F6;">
          🤖 <strong>Gemini Analizi:</strong><br>${p.aiAnalysis}
        </p>`
      : `<br><i style="color: #95a5a6; font-size: 12px;">🤖 Yapay zeka analiz ediyor...</i>`;

    return `
      <div style="font-family: 'Inter', sans-serif; padding: 5px; min-width: 220px;">
        <h4 style="margin: 0 0 4px 0; color: #1E3A8A; font-weight: 700;">📍 ${p.name}</h4>
        <span style="font-size: 11px; color: #6B7280; font-weight: 500;">Durum: ${statusIcon} ${statusText}</span>
        ${aiSection}
      </div>
    `;
  }
}