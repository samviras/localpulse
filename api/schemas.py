from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any

class LocationBase(BaseModel):
    name: str
    address: str
    lat: float
    lng: float
    category: str = "coffee_shop"

class LocationCreate(LocationBase):
    pass

class Location(LocationBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class CompetitorBase(BaseModel):
    name: str
    address: str
    lat: float
    lng: float
    category: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    distance_km: float

class CompetitorCreate(CompetitorBase):
    location_id: int
    google_place_id: str

class Competitor(CompetitorBase):
    id: int
    location_id: int
    google_place_id: str
    created_at: datetime
    last_updated: datetime
    
    class Config:
        from_attributes = True

class CompetitorWithTrend(Competitor):
    latest_rating: Optional[float] = None
    latest_review_count: Optional[int] = None
    reviews_per_week: Optional[float] = None
    rating_trend: Optional[str] = None  # "up", "down", "stable"
    rating_change: Optional[float] = None

class CompetitorSnapshotBase(BaseModel):
    rating: Optional[float] = None
    review_count: Optional[int] = None
    price_level: Optional[int] = None
    business_status: str = "OPERATIONAL"
    photos_count: Optional[int] = None
    opening_hours: Optional[Dict[str, Any]] = None
    reviews_per_week: Optional[float] = None
    rating_change: Optional[float] = None

class CompetitorSnapshotCreate(CompetitorSnapshotBase):
    competitor_id: int

class CompetitorSnapshot(CompetitorSnapshotBase):
    id: int
    competitor_id: int
    snapshot_date: datetime
    
    class Config:
        from_attributes = True

class AlertBase(BaseModel):
    alert_type: str
    severity: str
    title: str
    description: str
    data: Optional[Dict[str, Any]] = None

class AlertCreate(AlertBase):
    location_id: int
    competitor_id: Optional[int] = None

class Alert(AlertBase):
    id: int
    location_id: int
    competitor_id: Optional[int] = None
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class WeeklyBriefBase(BaseModel):
    title: str
    content: str

class WeeklyBriefCreate(WeeklyBriefBase):
    location_id: int
    week_start: datetime
    week_end: datetime

class WeeklyBrief(WeeklyBriefBase):
    id: int
    location_id: int
    week_start: datetime
    week_end: datetime
    generated_at: datetime
    
    class Config:
        from_attributes = True

class DashboardSummary(BaseModel):
    total_locations: int
    competitors_tracked: int
    active_alerts: int
    avg_rating_delta: float