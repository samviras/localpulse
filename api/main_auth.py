"""LocalPulse API with Authentication and AI Recommendations"""
from fastapi import FastAPI, Depends, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
import os
from datetime import datetime, timedelta
from pydantic import BaseModel

from database import get_db, init_db, SessionLocal
from models import (
    Location, Competitor, CompetitorSnapshot, Alert, WeeklyBrief, User, 
    UserLocation, Recommendation
)
from schemas import (
    LocationCreate, Location as LocationOut, Competitor as CompetitorOut,
    CompetitorSnapshot as CompetitorSnapshotOut, Alert as AlertOut, 
    WeeklyBrief as WeeklyBriefOut, DashboardSummary
)
from demo_data import seed_demo_data
from real_data import load_real_coffee_shops, refresh_competitor_data
from ai_recommendations import generate_recommendations, analyze_weekly_brief
from places_api import PlacesAPIClient

# Optional: auth is disabled in demo mode
try:
    from auth import verify_token, get_or_create_user
except ImportError:
    print("⚠️  Auth module not available (Firebase dependencies missing)")
    def verify_token(*args, **kwargs):
        raise HTTPException(status_code=401, detail="Auth not configured")
    def get_or_create_user(*args, **kwargs):
        return None

# Optional: cron jobs
try:
    from cron_jobs import init_scheduler, shutdown_scheduler
except ImportError:
    print("⚠️  Scheduler not available (APScheduler missing)")
    def init_scheduler():
        pass
    def shutdown_scheduler():
        pass

FRONTEND_URL = os.getenv("FRONTEND_URL", "")
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"
GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY", "")

app = FastAPI(title="LocalPulse API", version="2.0.0")

allowed_origins = [
    "http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173",
    "https://localpulse.vercel.app",
    "https://frontend-neon-seven-26.vercel.app",
]
if FRONTEND_URL:
    allowed_origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ SCHEMA MODELS ============

class OnboardingRequest(BaseModel):
    business_name: str
    business_type: str  # coffee_shop, restaurant, bakery, etc.
    latitude: float
    longitude: float
    address: str
    timezone: str = "UTC"

class RecommendationOut(BaseModel):
    id: int
    location_id: int
    competitor_id: Optional[int] = None
    recommendation_type: str
    title: str
    description: str
    rationale: str
    priority: str
    status: str
    generated_at: datetime

class BriefOut(BaseModel):
    id: int
    location_id: int
    week_start: datetime
    week_end: datetime
    title: str
    content: str
    generated_at: datetime

# ============ STARTUP/SHUTDOWN ============

@app.on_event("startup")
async def startup():
    init_db()
    if DEMO_MODE:
        seed_demo_data()
    elif GOOGLE_PLACES_API_KEY:
        try:
            load_real_coffee_shops(api_key=GOOGLE_PLACES_API_KEY)
        except Exception as e:
            print(f"⚠️  Could not load real data: {e}")
    
    # Initialize cron jobs
    try:
        init_scheduler()
    except Exception as e:
        print(f"⚠️  Could not initialize scheduler: {e}")

@app.on_event("shutdown")
async def shutdown():
    shutdown_scheduler()

# ============ HEALTH CHECK ============

@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "demo_mode": DEMO_MODE
    }

# ============ AUTHENTICATION ============

@app.post("/api/auth/signup")
async def signup(email: str, password: str = Query(...), db: Session = Depends(get_db)):
    """
    Note: In production, this would use Firebase Auth client SDK.
    This endpoint is mainly for demonstration.
    """
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # In real app, Firebase handles password hashing
    user = User(
        email=email,
        firebase_uid=f"demo_{email}",  # Would be Firebase UID
        onboarding_complete=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {"id": user.id, "email": user.email, "message": "Signup successful. Complete onboarding next."}

@app.post("/api/auth/onboarding")
async def complete_onboarding(
    onboarding: OnboardingRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Complete user onboarding and fetch top 5 competitors"""
    
    # Get user (either by token or by creation)
    uid = None
    if authorization:
        try:
            uid = verify_token(authorization)
        except:
            pass
    
    # For demo mode, allow without auth
    if not uid and not DEMO_MODE:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Get or create user
    user = None
    if uid:
        user = db.query(User).filter(User.firebase_uid == uid).first()
    
    if not user and DEMO_MODE:
        # Demo mode: create a temporary user
        user = User(
            email=f"demo_{datetime.utcnow().timestamp()}@local.test",
            firebase_uid=f"demo_{datetime.utcnow().timestamp()}",
            onboarding_complete=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user with business info
    user.business_name = onboarding.business_name
    user.business_type = onboarding.business_type
    user.business_lat = onboarding.latitude
    user.business_lng = onboarding.longitude
    user.business_address = onboarding.address
    user.timezone = onboarding.timezone
    user.onboarding_complete = True
    user.updated_at = datetime.utcnow()
    db.commit()
    
    # Create/get the location
    location = Location(
        name=onboarding.business_name,
        address=onboarding.address,
        lat=onboarding.latitude,
        lng=onboarding.longitude,
        category=onboarding.business_type,
        created_at=datetime.utcnow()
    )
    db.add(location)
    db.commit()
    db.refresh(location)
    
    # Link user to location
    user_location = UserLocation(
        user_id=user.id,
        location_id=location.id
    )
    db.add(user_location)
    db.commit()
    
    # Fetch top 5 competitors from Google Places
    if not GOOGLE_PLACES_API_KEY:
        return {
            "user_id": user.id,
            "location_id": location.id,
            "onboarding_complete": True,
            "message": "Onboarding complete. Competitors will appear once API key is configured.",
            "competitors": []
        }
    
    try:
        places_api = PlacesAPIClient(api_key=GOOGLE_PLACES_API_KEY)
        competitors_data = places_api.search_nearby(
            latitude=onboarding.latitude,
            longitude=onboarding.longitude,
            keyword=onboarding.business_type,
            radius=500
        )
        
        # Store top 5 competitors
        for i, comp_data in enumerate(competitors_data[:5]):
            competitor = Competitor(
                location_id=location.id,
                google_place_id=comp_data.get("place_id"),
                name=comp_data.get("name"),
                address=comp_data.get("vicinity", ""),
                lat=comp_data.get("geometry", {}).get("location", {}).get("lat", 0),
                lng=comp_data.get("geometry", {}).get("location", {}).get("lng", 0),
                category=onboarding.business_type,
                distance_km=comp_data.get("distance_km", 0.5),
                created_at=datetime.utcnow(),
                last_updated=datetime.utcnow()
            )
            db.add(competitor)
        
        db.commit()
        
        # Create initial snapshot for each competitor
        competitors = db.query(Competitor).filter(
            Competitor.location_id == location.id
        ).all()
        
        for comp in competitors:
            if comp.google_place_id:
                try:
                    details = places_api.get_place_details(comp.google_place_id)
                    if details:
                        snapshot = CompetitorSnapshot(
                            competitor_id=comp.id,
                            snapshot_date=datetime.utcnow(),
                            rating=details.get("rating", 4.0),
                            review_count=details.get("user_ratings_total", 0),
                            price_level=details.get("price_level", 2),
                            business_status=details.get("business_status", "OPERATIONAL"),
                            reviews_per_week=0.5,
                            rating_change=0
                        )
                        db.add(snapshot)
                except:
                    pass
        
        db.commit()
        
        return {
            "user_id": user.id,
            "location_id": location.id,
            "onboarding_complete": True,
            "business_name": user.business_name,
            "competitors_tracked": len(competitors),
            "message": "Onboarding complete. Dashboard ready!"
        }
    
    except Exception as e:
        print(f"⚠️  Error fetching competitors: {e}")
        return {
            "user_id": user.id,
            "location_id": location.id,
            "onboarding_complete": True,
            "message": f"Onboarding complete. Error fetching competitors: {str(e)}"
        }

# ============ DASHBOARD & LOCATIONS ============

@app.get("/api/dashboard-summary", response_model=DashboardSummary)
async def get_dashboard_summary(db: Session = Depends(get_db)):
    """Get dashboard summary metrics"""
    total_locations = db.query(func.count(Location.id)).scalar()
    competitors_tracked = db.query(func.count(Competitor.id)).scalar()
    active_alerts = db.query(func.count(Alert.id)).filter(Alert.is_read == False).scalar()
    
    all_ratings = db.query(CompetitorSnapshot.rating).filter(
        CompetitorSnapshot.rating.isnot(None)
    ).all()
    competitor_avg = sum(r[0] for r in all_ratings) / len(all_ratings) if all_ratings else 0
    
    my_avg_rating = 4.5  # Would calculate from user's business data
    avg_rating_delta = my_avg_rating - competitor_avg
    
    return DashboardSummary(
        total_locations=total_locations or 0,
        competitors_tracked=competitors_tracked or 0,
        active_alerts=active_alerts or 0,
        my_avg_rating=my_avg_rating,
        competitor_avg_rating=competitor_avg,
        avg_rating_delta=avg_rating_delta
    )

@app.get("/api/locations", response_model=List[LocationOut])
async def get_locations(db: Session = Depends(get_db)):
    """Get all monitored locations"""
    return db.query(Location).all()

@app.get("/api/locations/{location_id}/competitors", response_model=List[CompetitorOut])
async def get_location_competitors(location_id: int, db: Session = Depends(get_db)):
    """Get competitors for a specific location"""
    competitors = db.query(Competitor).filter(Competitor.location_id == location_id).all()
    
    result = []
    for c in competitors:
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

# ============ RECOMMENDATIONS ============

@app.get("/api/locations/{location_id}/recommendations", response_model=List[RecommendationOut])
async def get_recommendations(location_id: int, db: Session = Depends(get_db)):
    """Get AI-generated recommendations for a location"""
    recommendations = db.query(Recommendation).filter(
        Recommendation.location_id == location_id
    ).order_by(Recommendation.priority.desc()).all()
    return recommendations

@app.post("/api/locations/{location_id}/generate-recommendations")
async def trigger_recommendations(location_id: int, db: Session = Depends(get_db)):
    """Manually trigger recommendation generation"""
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    try:
        recs = generate_recommendations(location_id, db)
        return {
            "status": "success",
            "recommendations_generated": len(recs),
            "message": f"Generated {len(recs)} recommendations"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ============ ALERTS ============

@app.get("/api/alerts", response_model=List[AlertOut])
async def get_alerts(
    location_id: Optional[int] = Query(None),
    alert_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    is_read: Optional[bool] = Query(None),
    limit: int = Query(50),
    db: Session = Depends(get_db)
):
    """Get alerts with filtering"""
    q = db.query(Alert).order_by(desc(Alert.created_at))
    if location_id:
        q = q.filter(Alert.location_id == location_id)
    if alert_type:
        q = q.filter(Alert.alert_type == alert_type)
    if severity:
        q = q.filter(Alert.severity == severity)
    if is_read is not None:
        q = q.filter(Alert.is_read == is_read)
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
    """Mark an alert as read"""
    a = db.query(Alert).filter(Alert.id == alert_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")
    a.is_read = True
    db.commit()
    return {"message": "Alert marked as read"}

# ============ WEEKLY BRIEFS ============

@app.get("/api/briefs", response_model=List[BriefOut])
async def get_briefs(location_id: Optional[int] = Query(None), limit: int = Query(20), db: Session = Depends(get_db)):
    """Get weekly briefs"""
    q = db.query(WeeklyBrief).order_by(desc(WeeklyBrief.generated_at))
    if location_id:
        q = q.filter(WeeklyBrief.location_id == location_id)
    briefs = q.limit(limit).all()
    return briefs

@app.post("/api/locations/{location_id}/generate-brief")
async def generate_brief(location_id: int, db: Session = Depends(get_db)):
    """Generate weekly brief for a location"""
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    try:
        content = analyze_weekly_brief(location_id, db)
        brief = WeeklyBrief(
            location_id=location_id,
            week_start=datetime.utcnow() - timedelta(days=7),
            week_end=datetime.utcnow(),
            title=f"Weekly Brief — {location.name} — {datetime.utcnow().strftime('%b %d')}",
            content=content,
            generated_at=datetime.utcnow()
        )
        db.add(brief)
        db.commit()
        return {"status": "success", "brief_id": brief.id, "message": "Brief generated"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ============ LEGACY ENDPOINTS (for backwards compat) ============

@app.post("/api/locations/{location_id}/scan")
async def scan_competitors(location_id: int, db: Session = Depends(get_db)):
    """Scan for new competitors (legacy endpoint)"""
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(404, "Location not found")
    return {"message": f"Scan initiated for {loc.name}", "status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main_auth:app", host="0.0.0.0", port=8000, reload=True)
