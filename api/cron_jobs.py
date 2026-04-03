"""Scheduled cron jobs for LocalPulse"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Location, Competitor, CompetitorSnapshot, WeeklyBrief, Alert
from real_data import refresh_competitor_data
from ai_recommendations import generate_recommendations, analyze_weekly_brief
from datetime import datetime, timedelta
import os

scheduler = None

def init_scheduler():
    """Initialize the scheduler"""
    global scheduler
    if scheduler is None:
        scheduler = AsyncIOScheduler()
        
        # Monday 6 AM UTC - Weekly data refresh + recommendations + brief
        scheduler.add_job(
            weekly_intelligence_job,
            CronTrigger(day_of_week="mon", hour=6, minute=0),
            id="weekly_intelligence",
            name="Weekly Intelligence Report",
            replace_existing=True
        )
        
        scheduler.start()
        print("✅ Scheduler initialized with weekly intelligence job")

async def weekly_intelligence_job():
    """Run every Monday at 6 AM UTC"""
    print(f"🔄 Running weekly intelligence job at {datetime.utcnow()}")
    db = SessionLocal()
    try:
        # Get all locations
        locations = db.query(Location).all()
        
        for location in locations:
            print(f"  Processing {location.name}...")
            
            # 1. Refresh competitor data from Google Places
            try:
                api_key = os.getenv("GOOGLE_PLACES_API_KEY")
                if api_key:
                    refresh_competitor_data(location.id, db, api_key)
                    print(f"    ✅ Updated competitor data")
            except Exception as e:
                print(f"    ⚠️  Could not refresh competitor data: {e}")
            
            # 2. Generate AI recommendations
            try:
                recs = generate_recommendations(location.id, db)
                print(f"    ✅ Generated {len(recs)} recommendations")
            except Exception as e:
                print(f"    ⚠️  Could not generate recommendations: {e}")
            
            # 3. Generate weekly brief
            try:
                brief_content = analyze_weekly_brief(location.id, db)
                brief = WeeklyBrief(
                    location_id=location.id,
                    week_start=datetime.utcnow() - timedelta(days=7),
                    week_end=datetime.utcnow(),
                    title=f"Weekly Brief — {location.name} — {datetime.utcnow().strftime('%b %d')}",
                    content=brief_content,
                    generated_at=datetime.utcnow()
                )
                db.add(brief)
                db.commit()
                print(f"    ✅ Generated weekly brief")
            except Exception as e:
                print(f"    ⚠️  Could not generate brief: {e}")
        
        print("✅ Weekly intelligence job completed")
    finally:
        db.close()

def shutdown_scheduler():
    """Shutdown the scheduler gracefully"""
    global scheduler
    if scheduler and scheduler.running:
        scheduler.shutdown()
        print("✅ Scheduler shutdown")

# Alternative: Simple daily check (less resource intensive)
async def daily_check_job():
    """Run daily data consistency checks"""
    db = SessionLocal()
    try:
        # Check for stale competitor data (>7 days old)
        week_ago = datetime.utcnow() - timedelta(days=7)
        stale = db.query(Competitor).filter(Competitor.last_updated < week_ago).all()
        if stale:
            print(f"⚠️  {len(stale)} competitors have stale data")
        
        # Clean up old snapshots (>90 days)
        ninety_ago = datetime.utcnow() - timedelta(days=90)
        old_snapshots = db.query(CompetitorSnapshot).filter(
            CompetitorSnapshot.snapshot_date < ninety_ago
        ).delete()
        if old_snapshots:
            db.commit()
            print(f"🗑️  Cleaned up {old_snapshots} old snapshots")
    finally:
        db.close()
