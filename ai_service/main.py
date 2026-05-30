from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
import google.generativeai as genai
import json
import os
from dotenv import load_dotenv

# .env dosyasındaki gizli şifreleri sisteme yükle
load_dotenv()

app = FastAPI(title="GeoTracker AI Analyzer Service")

# Şifreyi çevre değişkenlerinden (environment variables) çek
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Eğer .env okunamazsa veya şifre yoksa sistemi uyar
if not GEMINI_API_KEY:
    raise ValueError("KRITIK HATA: GEMINI_API_KEY bulunamadi. Lütfen .env dosyanizi kontrol edin.")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('models/gemini-3.5-flash')


@app.get("/")
def read_root():
    return {"message": "Real-Time AI Service is running with Google Gemini!"}

@app.get("/api/analyze")
async def analyze_location(lat: float = Query(...), lng: float = Query(...)):
    
    prompt = f"""
    Sen uzman bir Coğrafi Bilgi Sistemleri (GIS) ve Risk Analistisin. 
    Verilen koordinatları (Enlem: {lat}, Boylam: {lng}) genel coğrafi bağlamda değerlendir.
    Bu bölge genel olarak dağlık mı, ormanlık mı, deniz kenarı mı yoksa şehir merkezi mi tahmin et ve buna göre kurgusal bir 'Risk Skoru' üret.
    
    LÜTFEN SADECE AŞAĞIDAKİ FORMATTA GEÇERLİ BİR JSON DÖNDÜR. Başka hiçbir metin veya markdown (```json) ekleme:
    {{
        "ai_risk_score": <0 ile 100 arasında bir tam sayı>,
        "ai_analysis": "<Bölge hakkında en fazla 2 cümlelik Türkçe coğrafi analiz ve risk değerlendirmesi>"
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
            
        ai_data = json.loads(response_text)
        return JSONResponse(content=ai_data)

    except Exception as e:
        print(f"AI Error: {e}")
        return JSONResponse(content={
            "ai_risk_score": 50,
            "ai_analysis": "Yapay zeka servisine şu an ulaşılamıyor, standart risk skoru atandı."
        })