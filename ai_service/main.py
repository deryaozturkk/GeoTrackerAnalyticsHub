from fastapi import FastAPI
import random

app = FastAPI(title="GeoTracker AI Analyzer Service")

@app.get("/")
def read_root():
    return {"message": "AI Service is running!"}

@app.get("/api/analyze")
def analyze_location(lat: float, lng: float):
    # Sanki burada LangChain veya OpenAI çalışıyormuş gibi bir simülasyon yapıyoruz
    risk_score = random.randint(10, 95)
    
    analysis = "Normal bölge."
    if risk_score > 70:
        analysis = "Yüksek potansiyelli / Riskli bölge tespit edildi. CRM ekibinin dikkatine!"
    elif risk_score < 30:
        analysis = "Güvenli ve sakin bölge. Yeni yatırımlar için uygun."
        
    return {
        "latitude": lat,
        "longitude": lng,
        "ai_risk_score": risk_score,
        "ai_analysis": analysis,
        "model_version": "GeoTracker-LLM-v1"
    }