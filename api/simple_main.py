from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="LocalPulse API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporarily allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "LocalPulse API is running", "status": "healthy"}

@app.get("/api/health")
async def health():
    return {"status": "healthy", "demo_mode": True}

@app.get("/api/companies")
async def get_companies():
    return [
        {
            "id": 1,
            "name": "TechFlow Solutions",
            "industry": "Software Development",
            "website": "https://techflow.example.com",
            "description": "AI-powered workflow automation platform",
            "employee_count": 150,
            "revenue": 5000000.0,
            "location": "San Francisco, CA",
            "created_at": "2024-01-01T00:00:00"
        },
        {
            "id": 2,
            "name": "DataSync Corp",
            "industry": "Data Analytics",
            "website": "https://datasync.example.com",
            "description": "Real-time data integration and analytics",
            "employee_count": 200,
            "revenue": 8000000.0,
            "location": "Austin, TX",
            "created_at": "2024-01-01T00:00:00"
        }
    ]

@app.get("/api/analysis")
async def get_analysis():
    return [
        {
            "id": 1,
            "company_id": 1,
            "strengths": "Strong AI capabilities, user-friendly interface",
            "weaknesses": "Limited enterprise features, high pricing",
            "opportunities": "Growing automation market, enterprise expansion",
            "threats": "Major tech companies entering space",
            "market_share": 15.5,
            "competitive_score": 7.2,
            "analysis_date": "2024-01-01T00:00:00",
            "company": {
                "id": 1,
                "name": "TechFlow Solutions",
                "industry": "Software Development",
                "location": "San Francisco, CA"
            }
        }
    ]

@app.get("/api/trends")
async def get_trends():
    return [
        {
            "id": 1,
            "trend": "AI Automation Growth",
            "impact": "High",
            "date": "2024-01-01T00:00:00"
        },
        {
            "id": 2,
            "trend": "Remote Work Data Security",
            "impact": "High",
            "date": "2024-01-01T00:00:00"
        }
    ]

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)