from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="LocalPulse API")

# CORS for Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "healthy", "message": "LocalPulse API is running"}

@app.get("/api/dashboard/summary")
def summary():
    return {
        "total_locations": 3,
        "competitors_tracked": 15, 
        "active_alerts": 2,
        "avg_rating_delta": 0.15
    }

@app.get("/")
def root():
    return {"message": "LocalPulse API - Competitive Intelligence Dashboard"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)