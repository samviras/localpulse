"""AI-powered recommendations using Anthropic Claude"""
import os
from anthropic import Anthropic
from sqlalchemy.orm import Session
from models import Location, Competitor, CompetitorSnapshot, Recommendation
from datetime import datetime
from typing import List

client = Anthropic()

def generate_recommendations(location_id: int, db: Session) -> List[Recommendation]:
    """Generate AI-powered recommendations for a location based on competitor data"""
    
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        return []
    
    # Get top 5 competitors with latest snapshots
    competitors = db.query(Competitor).filter(
        Competitor.location_id == location_id
    ).all()
    
    competitor_data = []
    for c in competitors:
        latest = db.query(CompetitorSnapshot).filter(
            CompetitorSnapshot.competitor_id == c.id
        ).order_by(CompetitorSnapshot.snapshot_date.desc()).first()
        
        if latest:
            competitor_data.append({
                "id": c.id,
                "name": c.name,
                "rating": latest.rating,
                "review_count": latest.review_count,
                "price_level": latest.price_level,
                "business_status": latest.business_status,
                "reviews_per_week": latest.reviews_per_week,
                "distance_km": c.distance_km,
                "website": c.website,
            })
    
    if not competitor_data:
        return []
    
    # Create prompt for Claude
    prompt = f"""Analyze the following competitive landscape and provide specific, actionable recommendations for {location.name} ({location.category}).

Location: {location.name}
Address: {location.address}
Category: {location.category}

Top Competitors:
{format_competitor_data(competitor_data)}

Based on this data, provide 3-5 specific recommendations in JSON format:
[
  {{
    "type": "price|menu|hours|marketing|service",
    "title": "Specific action (e.g., 'Lower espresso price by $0.50')",
    "description": "What to do",
    "rationale": "Why this recommendation based on competitor data",
    "priority": "low|medium|high",
    "competitor_id": <competitor_id_if_relevant or null>
  }}
]

Focus on:
1. Price positioning vs competitors
2. Service gaps (hours, menu items)
3. Market opportunities (where competitors are weak)
4. Rating and review opportunities
5. Pricing strategy based on price_level (1-4)

Return ONLY valid JSON array, no markdown or extra text."""
    
    try:
        # Call Claude API
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        response_text = message.content[0].text.strip()
        
        # Parse JSON response
        import json
        recommendations_data = json.loads(response_text)
        
        # Create Recommendation objects
        recommendations = []
        for rec_data in recommendations_data:
            # Delete existing recommendations of same type from this location
            db.query(Recommendation).filter(
                Recommendation.location_id == location_id,
                Recommendation.recommendation_type == rec_data.get("type")
            ).delete()
            
            recommendation = Recommendation(
                location_id=location_id,
                competitor_id=rec_data.get("competitor_id"),
                recommendation_type=rec_data.get("type"),
                title=rec_data.get("title"),
                description=rec_data.get("description"),
                rationale=rec_data.get("rationale"),
                priority=rec_data.get("priority", "medium"),
                status="pending",
                generated_at=datetime.utcnow()
            )
            db.add(recommendation)
            recommendations.append(recommendation)
        
        db.commit()
        return recommendations
        
    except Exception as e:
        print(f"❌ Error generating recommendations: {e}")
        return []

def format_competitor_data(competitors: List[dict]) -> str:
    """Format competitor data for Claude prompt"""
    lines = []
    for i, c in enumerate(competitors[:5], 1):
        lines.append(f"""
{i}. {c['name']}
   - Rating: {c['rating']}/5.0 ({c['review_count']} reviews)
   - Reviews/week: {c['reviews_per_week']:.1f}
   - Price Level: {c['price_level']}/4
   - Distance: {c['distance_km']:.1f} km
   - Status: {c['business_status']}
   - Website: {c['website'] or 'N/A'}""")
    return "\n".join(lines)

def analyze_weekly_brief(location_id: int, db: Session) -> str:
    """Generate weekly intelligence brief using Claude"""
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        return ""
    
    # Get competitor snapshots from past week
    from datetime import timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)
    
    competitors = db.query(Competitor).filter(
        Competitor.location_id == location_id
    ).all()
    
    changes = []
    for c in competitors:
        snapshots = db.query(CompetitorSnapshot).filter(
            CompetitorSnapshot.competitor_id == c.id,
            CompetitorSnapshot.snapshot_date >= week_ago
        ).order_by(CompetitorSnapshot.snapshot_date).all()
        
        if len(snapshots) >= 2:
            old = snapshots[0]
            new = snapshots[-1]
            if old.rating and new.rating:
                rating_change = new.rating - old.rating
                if abs(rating_change) > 0.1:
                    changes.append(f"{c.name}: Rating {'↑' if rating_change > 0 else '↓'} {abs(rating_change):.2f}")
            if old.review_count and new.review_count:
                review_change = new.review_count - old.review_count
                if review_change > 5:
                    changes.append(f"{c.name}: +{review_change} new reviews")
    
    prompt = f"""Write a brief, actionable weekly intelligence report for {location.name}, a {location.category}.

Key Changes This Week:
{chr(10).join(changes) if changes else 'No significant changes detected'}

Focus on:
1. What changed in the competitive landscape
2. Threats to monitor
3. Opportunities to exploit
4. Specific actions to take this week

Keep it concise (2-3 paragraphs) and specific to {location.name}."""
    
    try:
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=512,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        return message.content[0].text
    except Exception as e:
        print(f"❌ Error generating brief: {e}")
        return f"Error generating brief: {str(e)}"
