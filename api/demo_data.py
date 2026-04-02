from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random

from database import SessionLocal
from models import Location, Competitor, CompetitorSnapshot, Alert, WeeklyBrief

def seed_demo_data():
    db = SessionLocal()
    
    # Clear existing data
    db.query(WeeklyBrief).delete()
    db.query(Alert).delete()
    db.query(CompetitorSnapshot).delete()
    db.query(Competitor).delete()
    db.query(Location).delete()
    db.commit()
    
    # Create my locations (Pulse Coffee shops)
    locations = [
        Location(
            name="Pulse Coffee Downtown",
            address="401 W Hastings St, Vancouver, BC",
            lat=49.2827,
            lng=-123.1207,
            category="coffee_shop"
        ),
        Location(
            name="Pulse Coffee Kitsilano",
            address="2182 W 4th Ave, Vancouver, BC",
            lat=49.2634,
            lng=-123.1654,
            category="coffee_shop"
        ),
        Location(
            name="Pulse Coffee Gastown",
            address="341 Water St, Vancouver, BC",
            lat=49.2843,
            lng=-123.1089,
            category="coffee_shop"
        ),
        Location(
            name="Pulse Coffee Mount Pleasant",
            address="2526 Main St, Vancouver, BC",
            lat=49.2622,
            lng=-123.1008,
            category="coffee_shop"
        ),
        Location(
            name="Pulse Coffee Commercial",
            address="1398 Commercial Dr, Vancouver, BC",
            lat=49.2733,
            lng=-123.0694,
            category="coffee_shop"
        )
    ]
    
    for location in locations:
        db.add(location)
    db.commit()
    db.refresh(locations[0])  # Get IDs
    
    # Define competitors with realistic Vancouver data
    competitor_data = [
        # Downtown area competitors
        {"name": "Starbucks - Granville", "address": "1100 Granville St", "lat": 49.2815, "lng": -123.1213, "location_ids": [1]},
        {"name": "Tim Hortons Downtown", "address": "789 W Pender St", "lat": 49.2856, "lng": -123.1221, "location_ids": [1]},
        {"name": "Blenz Coffee Downtown", "address": "375 Water St", "lat": 49.2848, "lng": -123.1078, "location_ids": [1, 3]},
        {"name": "Revolver Coffee", "address": "325 Cambie St", "lat": 49.2833, "lng": -123.1094, "location_ids": [1, 3]},
        
        # Kitsilano area competitors  
        {"name": "49th Parallel Kitsilano", "address": "2198 W 4th Ave", "lat": 49.2635, "lng": -123.1663, "location_ids": [2]},
        {"name": "Matchstick Coffee", "address": "639 W Broadway", "lat": 49.2634, "lng": -123.1389, "location_ids": [2, 4]},
        {"name": "Trees Organic Coffee", "address": "2242 W 4th Ave", "lat": 49.2635, "lng": -123.1676, "location_ids": [2]},
        {"name": "JJ Bean Kitsilano", "address": "1844 W 1st Ave", "lat": 49.2713, "lng": -123.1537, "location_ids": [2]},
        
        # Gastown area competitors
        {"name": "Timbertrain Coffee Roasters", "address": "311 W Cordova St", "lat": 49.2844, "lng": -123.1086, "location_ids": [3]},
        {"name": "Nemesis Coffee", "address": "289 Alexander St", "lat": 49.2847, "lng": -123.1069, "location_ids": [3]},
        
        # Mount Pleasant competitors
        {"name": "Elysian Coffee", "address": "590 W Broadway", "lat": 49.2634, "lng": -123.1381, "location_ids": [4]},
        {"name": "Small Victory Bakery", "address": "1088 Homer St", "lat": 49.2756, "lng": -123.1242, "location_ids": [4]},
        
        # Commercial Drive competitors
        {"name": "Nemesis Coffee Commercial", "address": "1321 Commercial Dr", "lat": 49.2724, "lng": -123.0691, "location_ids": [5]},
        {"name": "Prado Cafe", "address": "1938 Commercial Dr", "lat": 49.2766, "lng": -123.0698, "location_ids": [5]},
        {"name": "Kafka's Coffee", "address": "2525 Main St", "lat": 49.2622, "lng": -123.1009, "location_ids": [4, 5]},
    ]
    
    competitors = []
    for i, comp_data in enumerate(competitor_data):
        for loc_id in comp_data["location_ids"]:
            # Calculate distance (simplified)
            location = next(l for l in locations if l.id == loc_id)
            distance = ((comp_data["lat"] - location.lat)**2 + (comp_data["lng"] - location.lng)**2)**0.5 * 111  # Rough km conversion
            
            competitor = Competitor(
                location_id=loc_id,
                google_place_id=f"place_id_{i}_{loc_id}",
                name=comp_data["name"],
                address=comp_data["address"],
                lat=comp_data["lat"],
                lng=comp_data["lng"],
                category="cafe",
                distance_km=round(distance, 2),
                created_at=datetime.utcnow() - timedelta(days=random.randint(30, 365))
            )
            competitors.append(competitor)
            db.add(competitor)
    
    db.commit()
    
    # Create 8 weeks of historical snapshots
    base_date = datetime.utcnow() - timedelta(weeks=8)
    
    for competitor in competitors:
        # Base rating and review count
        if "Nemesis Coffee Commercial" in competitor.name:
            # New competitor - only 3 weeks of data
            weeks_of_data = 3
            base_rating = 4.1
            base_reviews = 15
        elif "Matchstick Coffee" in competitor.name:
            # Declining competitor
            weeks_of_data = 8
            base_rating = 4.2
            base_reviews = 89
        elif "49th Parallel Kitsilano" in competitor.name:
            # Review surge competitor
            weeks_of_data = 8
            base_rating = 4.4
            base_reviews = 67
        else:
            # Regular competitors
            weeks_of_data = 8
            base_rating = round(random.uniform(3.5, 4.6), 1)
            base_reviews = random.randint(45, 150)
        
        previous_rating = None
        previous_review_count = base_reviews
        
        for week in range(weeks_of_data):
            snapshot_date = base_date + timedelta(weeks=week)
            
            # Generate realistic data evolution
            if "Nemesis Coffee Commercial" in competitor.name:
                # New competitor growing
                rating = base_rating + week * 0.05
                review_count = base_reviews + week * 8
                reviews_per_week = 8 + week
            elif "Matchstick Coffee" in competitor.name:
                # Declining competitor
                rating = base_rating - week * 0.05
                review_count = base_reviews + week * 2
                reviews_per_week = 2 + random.uniform(-1, 1)
            elif "49th Parallel Kitsilano" in competitor.name and week >= 5:
                # Review surge in last 3 weeks
                rating = base_rating + random.uniform(-0.1, 0.1)
                review_count = previous_review_count + 20  # Big jump
                reviews_per_week = 20
            else:
                # Regular evolution
                rating = base_rating + random.uniform(-0.1, 0.1)
                review_count = previous_review_count + random.randint(1, 8)
                reviews_per_week = random.uniform(2, 8)
            
            rating = max(1.0, min(5.0, rating))  # Clamp to valid range
            rating_change = 0.0
            if previous_rating:
                rating_change = rating - previous_rating
            
            snapshot = CompetitorSnapshot(
                competitor_id=competitor.id,
                rating=round(rating, 1),
                review_count=review_count,
                price_level=random.randint(1, 3),
                business_status="OPERATIONAL",
                photos_count=random.randint(10, 50),
                snapshot_date=snapshot_date,
                reviews_per_week=round(reviews_per_week, 1),
                rating_change=round(rating_change, 2)
            )
            
            db.add(snapshot)
            previous_rating = rating
            previous_review_count = review_count
    
    db.commit()
    
    # Create alerts based on the story
    alerts_data = [
        {
            "location_id": 5,  # Commercial Drive
            "competitor_name": "Nemesis Coffee Commercial",
            "alert_type": "NEW_COMPETITOR",
            "severity": "medium",
            "title": "New Competitor Detected",
            "description": "Nemesis Coffee Commercial opened 3 weeks ago on Commercial Drive. Currently rated 4.3/5 with growing review velocity.",
            "days_ago": 21
        },
        {
            "location_id": 4,  # Mount Pleasant  
            "competitor_name": "Matchstick Coffee",
            "alert_type": "RATING_DROP",
            "severity": "high",
            "title": "Competitor Rating Decline",
            "description": "Matchstick Coffee rating dropped from 4.2 to 3.8 over 8 weeks. Opportunity to capture dissatisfied customers.",
            "days_ago": 2
        },
        {
            "location_id": 2,  # Kitsilano
            "competitor_name": "49th Parallel Kitsilano", 
            "alert_type": "REVIEW_SURGE",
            "severity": "medium",
            "title": "Review Activity Spike",
            "description": "49th Parallel Kitsilano saw review velocity jump from 5/week to 20/week. Investigate potential marketing campaign.",
            "days_ago": 5
        },
        {
            "location_id": 1,
            "alert_type": "RATING_JUMP",
            "severity": "low", 
            "title": "Pulse Downtown Performing Well",
            "description": "Your downtown location maintains strong 4.3-4.5 rating consistently above local average.",
            "days_ago": 7
        },
        {
            "location_id": 4,
            "alert_type": "RATING_DROP",
            "severity": "medium",
            "title": "Mount Pleasant Location Underperforming", 
            "description": "Pulse Mount Pleasant at 3.9 stars, below area average of 4.1. Consider service improvements.",
            "days_ago": 3
        }
    ]
    
    for alert_data in alerts_data:
        competitor_id = None
        if "competitor_name" in alert_data:
            competitor = db.query(Competitor).filter(
                Competitor.name.contains(alert_data["competitor_name"])
            ).first()
            if competitor:
                competitor_id = competitor.id
        
        alert = Alert(
            location_id=alert_data["location_id"],
            competitor_id=competitor_id,
            alert_type=alert_data["alert_type"],
            severity=alert_data["severity"], 
            title=alert_data["title"],
            description=alert_data["description"],
            is_read=random.choice([True, False]),
            created_at=datetime.utcnow() - timedelta(days=alert_data["days_ago"])
        )
        db.add(alert)
    
    # Add a few more random alerts
    additional_alerts = [
        {
            "location_id": 3,
            "alert_type": "COMPETITOR_CLOSED", 
            "severity": "low",
            "title": "Competitor Temporarily Closed",
            "description": "Small cafe on Water Street closed for renovations. Temporary opportunity for increased foot traffic.",
            "days_ago": 14
        },
        {
            "location_id": 2,
            "alert_type": "NEW_COMPETITOR",
            "severity": "low",
            "title": "New Food Truck Spotted", 
            "description": "Coffee food truck appearing regularly near W 4th Ave intersection. Monitor impact on morning sales.",
            "days_ago": 10
        }
    ]
    
    for alert_data in additional_alerts:
        alert = Alert(
            location_id=alert_data["location_id"],
            alert_type=alert_data["alert_type"],
            severity=alert_data["severity"],
            title=alert_data["title"], 
            description=alert_data["description"],
            is_read=random.choice([True, False]),
            created_at=datetime.utcnow() - timedelta(days=alert_data["days_ago"])
        )
        db.add(alert)
    
    db.commit()
    
    # Create weekly briefs
    briefs_data = [
        {
            "location_id": 2,  # Kitsilano
            "title": "Kitsilano Competitive Landscape - Week of Mar 25",
            "content": """# Kitsilano Market Analysis

## Executive Summary
The Kitsilano coffee market remains highly competitive with 4 major players within 500m of our location. Overall market health is strong with growing review activity.

## Key Developments

### 🚀 49th Parallel Review Surge
- Review velocity jumped from 5/week to 20/week
- Rating stable at 4.4/5  
- Likely new marketing campaign or viral social media
- **Action**: Monitor their social channels and promotional offers

### 📉 Quality Concerns at Matchstick
- Rating declined from 4.1 to 3.9 over 4 weeks
- Common complaints: slow service, inconsistent quality
- **Opportunity**: Target their dissatisfied customers with superior service promise

### 🎯 Our Performance
- Pulse Kitsilano holding steady at 4.3/5
- Review velocity consistent at 6-7/week
- Price positioning competitive at level 2/4

## Recommendations
1. **Capitalize on Matchstick's decline** - Consider targeted local advertising
2. **Learn from 49th Parallel's success** - Investigate their recent marketing tactics
3. **Maintain service quality edge** - Customer service remains our key differentiator

## Next Week Focus
- Launch customer satisfaction survey
- Monitor competitor pricing changes
- Track review sentiment analysis""",
            "days_ago": 7
        },
        {
            "location_id": 1,  # Downtown
            "title": "Downtown Vancouver Coffee Market - Week of Mar 18", 
            "content": """# Downtown Market Report

## Market Overview
Downtown Vancouver coffee scene dominated by corporate chains but showing appetite for quality independents. High foot traffic area with office worker and tourist segments.

## Competitive Positioning

### Chain Competition
- **Starbucks Granville**: 4.1/5, high volume, premium pricing
- **Tim Hortons**: 3.8/5, value positioning, consistent traffic
- **Blenz Coffee**: 4.0/5, local chain, moderate pricing

### Independent Scene
- **Revolver Coffee**: 4.5/5, specialty focus, higher price point
- Strong reputation among coffee enthusiasts

## Our Position
- **Pulse Downtown**: 4.4/5 rating advantage over chains
- Positioned between value and premium segments
- Strong lunch rush performance

## Opportunities
1. **Target office workers** with loyalty program
2. **Weekend tourist traffic** underexploited  
3. **Premium drink offerings** to compete with Revolver

## Market Trends
- Increasing demand for oat milk alternatives
- Mobile ordering adoption growing
- Sustainability messaging resonating

## Action Items
- Implement mobile pre-order system
- Expand alternative milk options
- Develop weekend marketing strategy targeting visitors""",
            "days_ago": 14
        }
    ]
    
    for brief_data in briefs_data:
        brief = WeeklyBrief(
            location_id=brief_data["location_id"],
            title=brief_data["title"],
            content=brief_data["content"],
            week_start=datetime.utcnow() - timedelta(days=brief_data["days_ago"] + 6),
            week_end=datetime.utcnow() - timedelta(days=brief_data["days_ago"]),
            generated_at=datetime.utcnow() - timedelta(days=brief_data["days_ago"])
        )
        db.add(brief)
    
    db.commit()
    db.close()
    
    print("✅ Demo data seeded successfully!")
    print(f"   - {len(locations)} locations")
    print(f"   - {len(competitors)} competitor relationships") 
    print(f"   - {len(alerts_data) + len(additional_alerts)} alerts")
    print(f"   - {len(briefs_data)} weekly briefs")
    print("   - 8 weeks of historical snapshots")

if __name__ == "__main__":
    seed_demo_data()