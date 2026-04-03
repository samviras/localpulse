from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
import os
from datetime import datetime, timedelta

from database import get_db, init_db, SessionLocal
from models import Location, Competitor, CompetitorSnapshot, Alert, WeeklyBrief
from schemas import (
    LocationCreate, Location as LocationOut, Competitor as CompetitorOut,
    CompetitorSnapshot as CompetitorSnapshotOut, Alert as AlertOut, WeeklyBrief as WeeklyBriefOut, DashboardSummary
)
from demo_data import seed_demo_data
from real_data import load_real_coffee_shops

FRONTEND_URL = os.getenv("FRONTEND_URL", "")
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"
GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY", "")

app = FastAPI(title="LocalPulse API", version="1.0.0")

allowed_origins = [
    "http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173",
    "https://localpulse.vercel.app",
    "https://frontend-neon-seven-26.vercel.app",
]
if FRONTEND_URL:
    allowed_origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now (can restrict later)
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    init_db()
    if DEMO_MODE:
        seed_demo_data()
    elif GOOGLE_PLACES_API_KEY:
        # Load real data if API key is available and demo mode is off
        try:
            load_real_coffee_shops(api_key=GOOGLE_PLACES_API_KEY)
        except Exception as e:
            print(f"⚠️  Could not load real data: {e}")
            print("Falling back to demo data...")
            seed_demo_data()

@app.get("/api/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat(), "demo_mode": DEMO_MODE}

@app.get("/api/dashboard/summary", response_model=DashboardSummary)
async def dashboard_summary(db: Session = Depends(get_db)):
    total_locations = db.query(Location).count()
    competitors_tracked = db.query(Competitor).count()
    active_alerts = db.query(Alert).filter(Alert.is_read == False).count()

    # Latest snapshot per competitor
    subq = db.query(
        CompetitorSnapshot.competitor_id,
        func.max(CompetitorSnapshot.id).label("max_id")
    ).group_by(CompetitorSnapshot.competitor_id).subquery()
    latest = db.query(CompetitorSnapshot).join(subq, CompetitorSnapshot.id == subq.c.max_id).all()

    if latest:
        comp_avg = round(sum(s.rating for s in latest if s.rating) / max(len([s for s in latest if s.rating]), 1), 2)
    else:
        comp_avg = 0.0
    my_avg = 4.26  # Demo: our average across 5 locations
    delta = round(my_avg - comp_avg, 2)

    return DashboardSummary(
        total_locations=total_locations, competitors_tracked=competitors_tracked,
        active_alerts=active_alerts, avg_rating_delta=delta,
        my_avg_rating=my_avg, competitor_avg_rating=comp_avg,
    )

# --- LOCATIONS ---
@app.get("/api/locations", response_model=List[LocationOut])
async def get_locations(db: Session = Depends(get_db)):
    return db.query(Location).all()

@app.post("/api/locations", response_model=LocationOut)
async def create_location(loc: LocationCreate, db: Session = Depends(get_db)):
    obj = Location(**loc.dict())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@app.get("/api/locations/{location_id}/competitors")
async def location_competitors(location_id: int, db: Session = Depends(get_db)):
    comps = db.query(Competitor).filter(Competitor.location_id == location_id).all()
    result = []
    for c in comps:
        latest = db.query(CompetitorSnapshot).filter(
            CompetitorSnapshot.competitor_id == c.id
        ).order_by(desc(CompetitorSnapshot.snapshot_date)).first()

        d = {
            "id": c.id, "location_id": c.location_id, "google_place_id": c.google_place_id,
            "name": c.name, "address": c.address, "latitude": c.lat, "longitude": c.lng,
            "category": c.category, "phone": c.phone, "website": c.website,
            "distance_km": c.distance_km, "created_at": c.created_at.isoformat(),
            "last_updated": c.last_updated.isoformat(),
            "latest_rating": None, "latest_review_count": None, "latest_business_status": None,
            "reviews_per_week": None, "rating_trend": "stable",
        }
        if latest:
            d["latest_rating"] = latest.rating
            d["latest_review_count"] = latest.review_count
            d["latest_business_status"] = latest.business_status
            d["reviews_per_week"] = latest.reviews_per_week
            if latest.rating_change and latest.rating_change > 0.05:
                d["rating_trend"] = "up"
            elif latest.rating_change and latest.rating_change < -0.05:
                d["rating_trend"] = "down"
        result.append(d)
    return result

@app.post("/api/locations/{location_id}/scan")
async def scan_competitors(location_id: int, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(404, "Location not found")
    return {"message": f"Scan initiated for {loc.name}", "status": "success"}

# --- COMPETITORS ---
@app.get("/api/competitors/{competitor_id}")
async def get_competitor(competitor_id: int, db: Session = Depends(get_db)):
    c = db.query(Competitor).filter(Competitor.id == competitor_id).first()
    if not c:
        raise HTTPException(404, "Competitor not found")
    latest = db.query(CompetitorSnapshot).filter(
        CompetitorSnapshot.competitor_id == c.id
    ).order_by(desc(CompetitorSnapshot.snapshot_date)).first()
    loc = db.query(Location).filter(Location.id == c.location_id).first()

    return {
        "id": c.id, "location_id": c.location_id, "name": c.name, "address": c.address,
        "latitude": c.lat, "longitude": c.lng, "category": c.category,
        "distance_km": c.distance_km, "created_at": c.created_at.isoformat(),
        "location_name": loc.name if loc else None,
        "latest_rating": latest.rating if latest else None,
        "latest_review_count": latest.review_count if latest else None,
        "latest_business_status": latest.business_status if latest else None,
        "reviews_per_week": latest.reviews_per_week if latest else None,
        "price_level": latest.price_level if latest else None,
    }

@app.get("/api/competitors/{competitor_id}/history", response_model=List[CompetitorSnapshotOut])
async def competitor_history(competitor_id: int, db: Session = Depends(get_db)):
    return db.query(CompetitorSnapshot).filter(
        CompetitorSnapshot.competitor_id == competitor_id
    ).order_by(CompetitorSnapshot.snapshot_date).all()

# --- ALERTS ---
@app.get("/api/alerts")
async def get_alerts(
    location_id: Optional[int] = Query(None),
    alert_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    is_read: Optional[bool] = Query(None),
    limit: int = Query(50),
    db: Session = Depends(get_db)
):
    q = db.query(Alert).order_by(desc(Alert.created_at))
    if location_id: q = q.filter(Alert.location_id == location_id)
    if alert_type: q = q.filter(Alert.alert_type == alert_type)
    if severity: q = q.filter(Alert.severity == severity)
    if is_read is not None: q = q.filter(Alert.is_read == is_read)
    alerts = q.limit(limit).all()

    result = []
    for a in alerts:
        loc = db.query(Location).filter(Location.id == a.location_id).first()
        comp = db.query(Competitor).filter(Competitor.id == a.competitor_id).first() if a.competitor_id else None
        result.append({
            "id": a.id, "location_id": a.location_id, "competitor_id": a.competitor_id,
            "alert_type": a.alert_type, "severity": a.severity,
            "title": a.title, "description": a.description, "data": a.data,
            "is_read": a.is_read, "created_at": a.created_at.isoformat(),
            "location_name": loc.name if loc else None,
            "competitor_name": comp.name if comp else None,
        })
    return result

@app.post("/api/alerts/{alert_id}/read")
async def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    a = db.query(Alert).filter(Alert.id == alert_id).first()
    if not a: raise HTTPException(404, "Alert not found")
    a.is_read = True; db.commit()
    return {"message": "Alert marked as read"}

# --- BRIEFS ---
@app.get("/api/briefs")
async def get_briefs(location_id: Optional[int] = Query(None), limit: int = Query(20), db: Session = Depends(get_db)):
    q = db.query(WeeklyBrief).order_by(desc(WeeklyBrief.generated_at))
    if location_id: q = q.filter(WeeklyBrief.location_id == location_id)
    briefs = q.limit(limit).all()
    result = []
    for b in briefs:
        loc = db.query(Location).filter(Location.id == b.location_id).first()
        result.append({
            "id": b.id, "location_id": b.location_id,
            "week_start": b.week_start.isoformat(), "week_end": b.week_end.isoformat(),
            "title": b.title, "content": b.content, "generated_at": b.generated_at.isoformat(),
            "location_name": loc.name if loc else None,
        })
    return result

@app.get("/api/briefs/{brief_id}")
async def get_brief(brief_id: int, db: Session = Depends(get_db)):
    b = db.query(WeeklyBrief).filter(WeeklyBrief.id == brief_id).first()
    if not b: raise HTTPException(404, "Brief not found")
    loc = db.query(Location).filter(Location.id == b.location_id).first()
    return {
        "id": b.id, "location_id": b.location_id,
        "week_start": b.week_start.isoformat(), "week_end": b.week_end.isoformat(),
        "title": b.title, "content": b.content, "generated_at": b.generated_at.isoformat(),
        "location_name": loc.name if loc else None,
    }

@app.post("/api/briefs/generate")
async def generate_brief(location_id: int = Query(...), db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc: raise HTTPException(404, "Location not found")
    b = WeeklyBrief(
        location_id=location_id,
        week_start=datetime.utcnow() - timedelta(days=7),
        week_end=datetime.utcnow(),
        title=f"Weekly Brief — {loc.name} — {datetime.utcnow().strftime('%b %d')}",
        content=f"# {loc.name} — Weekly Brief\n\nGenerated on {datetime.utcnow().strftime('%B %d, %Y')}.\n\n*Auto-generated brief. In production, this would contain full competitive analysis.*",
        generated_at=datetime.utcnow(),
    )
    db.add(b); db.commit(); db.refresh(b)
    return {"id": b.id, "title": b.title, "message": "Brief generated"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
