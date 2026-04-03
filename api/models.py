from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    firebase_uid = Column(String, unique=True, index=True)  # Firebase UID
    business_name = Column(String)
    business_type = Column(String)  # coffee_shop, restaurant, etc.
    business_lat = Column(Float)  # From onboarding
    business_lng = Column(Float)  # From onboarding
    business_address = Column(String)
    timezone = Column(String, default="UTC")
    onboarding_complete = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    locations = relationship("UserLocation", back_populates="user")

class UserLocation(Base):
    __tablename__ = "user_locations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    location_id = Column(Integer, ForeignKey("locations.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="locations")
    location = relationship("Location", back_populates="user_locations")

class Location(Base):
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    address = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    category = Column(String, default="coffee_shop")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    competitors = relationship("Competitor", back_populates="location")
    alerts = relationship("Alert", back_populates="location")
    weekly_briefs = relationship("WeeklyBrief", back_populates="location")
    user_locations = relationship("UserLocation", back_populates="location")

class Competitor(Base):
    __tablename__ = "competitors"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"))
    google_place_id = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    address = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    category = Column(String)
    phone = Column(String)
    website = Column(String)
    distance_km = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    location = relationship("Location", back_populates="competitors")
    snapshots = relationship("CompetitorSnapshot", back_populates="competitor")
    alerts = relationship("Alert", back_populates="competitor")

class CompetitorSnapshot(Base):
    __tablename__ = "competitor_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    competitor_id = Column(Integer, ForeignKey("competitors.id"))
    rating = Column(Float)
    review_count = Column(Integer)
    price_level = Column(Integer)  # 1-4
    business_status = Column(String)  # OPERATIONAL, CLOSED_TEMPORARILY, etc.
    photos_count = Column(Integer)
    opening_hours = Column(JSON)
    snapshot_date = Column(DateTime, default=datetime.utcnow)
    reviews_per_week = Column(Float)
    rating_change = Column(Float)  # Change from previous snapshot
    
    # Relationships
    competitor = relationship("Competitor", back_populates="snapshots")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"))
    competitor_id = Column(Integer, ForeignKey("competitors.id"), nullable=True)
    alert_type = Column(String)  # NEW_COMPETITOR, RATING_DROP, RATING_JUMP, REVIEW_SURGE, COMPETITOR_CLOSED
    severity = Column(String)  # low, medium, high
    title = Column(String)
    description = Column(Text)
    data = Column(JSON)  # Additional data specific to alert type
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    location = relationship("Location", back_populates="alerts")
    competitor = relationship("Competitor", back_populates="alerts")

class WeeklyBrief(Base):
    __tablename__ = "weekly_briefs"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"))
    week_start = Column(DateTime)
    week_end = Column(DateTime)
    title = Column(String)
    content = Column(Text)  # Markdown content
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    location = relationship("Location", back_populates="weekly_briefs")

class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"))
    competitor_id = Column(Integer, ForeignKey("competitors.id"), nullable=True)
    recommendation_type = Column(String)  # price, menu, hours, etc.
    title = Column(String)  # e.g., "Lower espresso price by $0.50"
    description = Column(Text)  # Rationale and details
    rationale = Column(Text)  # Why this recommendation (competitor data, market analysis)
    priority = Column(String, default="medium")  # low, medium, high
    status = Column(String, default="pending")  # pending, implemented, dismissed
    generated_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    location = relationship("Location", foreign_keys=[location_id])
    competitor = relationship("Competitor", foreign_keys=[competitor_id])

class MenuItem(Base):
    __tablename__ = "menu_items"
    
    id = Column(Integer, primary_key=True, index=True)
    competitor_id = Column(Integer, ForeignKey("competitors.id"))
    item_name = Column(String, index=True)  # e.g., "Espresso", "Croissant"
    category = Column(String)  # e.g., "coffee", "pastry", "food", "beverage"
    description = Column(Text, nullable=True)  # Item description if available
    price = Column(Float, nullable=True)  # Price if available
    review_count = Column(Integer, default=0)  # How many reviews mention this item
    sentiment_score = Column(Float, nullable=True)  # 0-5 scale sentiment from reviews
    detected_date = Column(DateTime, default=datetime.utcnow)  # When item was first detected
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  # Last time item was updated
    source = Column(String)  # "google_places", "website", "reviews"
    is_active = Column(Boolean, default=True)  # Is item currently available
    
    # Relationships
    competitor = relationship("Competitor", backref="menu_items")
    snapshots = relationship("MenuItemSnapshot", back_populates="menu_item")

class MenuItemSnapshot(Base):
    __tablename__ = "menu_item_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"))
    snapshot_date = Column(DateTime, default=datetime.utcnow, index=True)  # When this snapshot was taken
    price = Column(Float, nullable=True)  # Price at this time
    review_count = Column(Integer)  # Review count at this time
    status = Column(String)  # "active", "removed", "added"
    sentiment_score = Column(Float, nullable=True)  # Sentiment at this time
    
    # Relationships
    menu_item = relationship("MenuItem", back_populates="snapshots")