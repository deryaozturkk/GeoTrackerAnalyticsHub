# GeoTracker & Analytics Hub 🌍

A modern, scalable **Polyglot Microservices** Web Application built with **.NET 8** (Clean Architecture), **Python FastAPI**, and **Angular 17**. This project is designed to handle Geographic Information Systems (GIS) data, specifically focusing on collecting, storing, visualizing, real-time processing via SignalR, and **AI-driven spatial analysis using Google Gemini 3.5 Flash LLM**.

## 📸 App Screenshots

<p align="center">
  <img src="assets/map-pending.png" alt="Real-Time SignalR Pending State" width="45%" >
  &nbsp;
  <img src="assets/map-analyzed.png" alt="Dynamic AI Result Popup" width="45%"  >
</p>

## 🚀 Key Features

* **Clean Architecture (Onion Architecture):** Strict separation of concerns across Domain, Application, Infrastructure, and Presentation layers.
* **Polyglot Microservices:** Distributed backend utilizing **.NET 8** for core business logic/data persistence and **Python FastAPI** for specialized AI/LLM spatial analysis.
* **Real-Time LLM Intelligence:** Integrates **Google Gemini 3.5 Flash** API to dynamically evaluate coordinates and generate contextual geographical risk assessments asynchronously.
* **Real-Time UI Updates:** Integrated **SignalR (WebSockets)** pushes asynchronous processing results from the .NET Worker directly to the Angular UI. Map pop-ups dynamically change from "Pending" to highly detailed, color-coded AI analysis without page reloads.
* **Modern Frontend (Angular 17):** Built using the latest Standalone Components architecture, offering a lightweight and modular user interface with custom dynamic Leaflet popups.
* **Open-Source Map Integration:** Utilizes **Leaflet.js** for high-performance, interactive maps without the dependency or cost of Google Maps API keys.
* **Asynchronous Processing:** Utilizes a highly optimized Background Worker Service (`IHostedService`) to process spatial data and communicate with the Python AI service without blocking the main API threads.
* **Secure Secrets Management:** Implemented environment variables (`.env`) using `python-dotenv` to safeguard API keys and sensitive credentials from version control.
* **PostgreSQL & Entity Framework Core:** Robust data persistence with Code-First approach and fully configured migrations.
* **Dependency Injection Mastery:** Proper handling of Scoped services (`DbContext`) within Singleton background tasks using `IServiceScopeFactory`.
* **Containerized:** Fully ready for deployment with a multi-stage Dockerfile.
* **Unit Testing:** Implemented xUnit and In-Memory database for reliable, lightning-fast component testing following the AAA principle.

## 🛠️ Technology Stack

* **Frontend:** Angular 17 (Standalone), TypeScript, SCSS, Leaflet.js
* **Backend (Core):** .NET 8 Web API, SignalR Hubs
* **Microservice (AI):** Python 3.12, FastAPI, Uvicorn, Google Generative AI (Gemini 3.5 Flash)
* **Language:** C# 12, Python 3
* **Architecture:** Clean Architecture / Microservices / Polyglot / Event-Driven
* **Database:** PostgreSQL
* **ORM:** Entity Framework Core 8
* **Security:** dotenv (.env) configuration
* **DevOps:** Docker
* **Testing:** xUnit, Moq, EF Core InMemory

## 📂 Project Structure

```text
GeoTrackerAnalyticsHub/
├── src/                                   # BACKEND (.NET 8)
│   ├── Core/
│   │   ├── GeoTracker.Domain              # Entities (PointOfInterest with AI fields)
│   │   └── GeoTracker.Application         # Interfaces (IMapNotificationService)
│   ├── Infrastructure/
│   │   ├── GeoTracker.Persistence         # EF Core DbContext & Migrations
│   │   └── GeoTracker.Workers             # Background Worker (HttpClient & AI logic)
│   └── Presentation/
│       └── GeoTracker.WebAPI              # Controllers, SignalR Hubs & Services
│
├── ai_service/                            # AI MICROSERVICE (Python)
│   ├── main.py                            # FastAPI & Gemini AI Analysis Logic
│   ├── .env                               # API Keys (Git ignored)
│   └── venv/                              # Python Virtual Environment
│
└── client/                                # FRONTEND (Angular 17)
    ├── src/app/
    │   └── app.component.ts               # Map UI, Dynamic Popups & SignalR Listener
    └── angular.json
```

## 🏗️ System Architecture Flow

```mermaid
flowchart TD
    %% Node Definitions with Shapes
    CLIENT("🗺️ Angular 17 / Leaflet Map UI")
    API("🌐 Web API Controllers")
    HUB("🔔 SignalR Hub")
    DB_CTX("🗄️ EF Core")
    WORKER("⚙️ Background Worker")
    PY_API("🐍 FastAPI / Gemini AI Engine")
    DB[("🐘 PostgreSQL")]

    %% Logical Groupings
    subgraph Frontend ["📱 Frontend Layer"]
        CLIENT
    end

    subgraph Presentation ["🌐 Presentation Layer (.NET)"]
        API
        HUB
    end

    subgraph Infrastructure ["🏗️ Infrastructure Layer (.NET)"]
        DB_CTX
        WORKER
    end

    subgraph External ["🧠 AI & 💾 Data Layer"]
        PY_API
        DB
    end

    %% Data Flow with Line Breaks (<br>) to prevent horizontal stretching
    CLIENT -- "1. POST /api/Points<br>(Click on Map)" --> API
    API -- "2. Save<br>(IsProcessed: false)" --> DB_CTX
    DB_CTX ==> DB

    WORKER -. "3. Periodic Scan" .-> DB_CTX
    WORKER -- "4. HTTP GET<br>/analyze" --> PY_API
    PY_API -- "5. Return<br>Gemini AI Score" --> WORKER
    WORKER -- "6. Update DB<br>(IsProcessed: true)" --> DB_CTX
    WORKER -- "7. Notify via Hub" --> HUB
    HUB -- "8. WebSocket Push" --> CLIENT
```

## ⚙️ Getting Started

### Prerequisites

* .NET 8 SDK
* Node.js (v18+) & Angular CLI (v17+)
* Python (3.10+)
* PostgreSQL
* Docker (Optional)
* Google AI Studio API Key (Free Tier)

### 1. Running the AI Microservice (Python)

Open a terminal and navigate to the `ai_service` directory:

```bash
cd ai_service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install fastapi uvicorn google-generativeai python-dotenv
```

**Security Configuration:**
Create a `.env` file in the `ai_service` root directory and add your Google Gemini API key:
```text
GEMINI_API_KEY=your_google_api_key_here
```

Start the service:
```bash
uvicorn main:app --reload --port 8000
```

### 2. Running the Backend (.NET) Locally

Open a new terminal and clone the repository if you haven't already.

Update the `DefaultConnection` string in:

```text
src/Presentation/GeoTracker.WebAPI/appsettings.json
```

with your PostgreSQL credentials.

Apply database migrations:

```bash
dotnet ef database update --project src/Infrastructure/GeoTracker.Persistence --startup-project src/Presentation/GeoTracker.WebAPI
```

Run the application:

```bash
cd src/Presentation/GeoTracker.WebAPI
dotnet run
```

Navigate to `http://localhost:5184/swagger` to access the API documentation.

### 3. Running the Frontend Locally

Open a new terminal and navigate to the frontend directory:

```bash
cd client
```

Install the necessary dependencies:

```bash
npm install
```

Start the Angular development server:

```bash
ng serve
```

Open your browser and navigate to `http://localhost:4200` to view the interactive map and test the real-time AI processing architecture.

## 🐳 Running with Docker (Backend)

```bash
docker build -t geotracker-api .
docker run -d -p 8080:8080 geotracker-api
```