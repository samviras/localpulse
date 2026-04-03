"""Menu extraction and tracking service for competitors"""
from datetime import datetime
from sqlalchemy.orm import Session
from models import Competitor, MenuItem, MenuItemSnapshot
import requests
from typing import List, Dict, Optional

# Sample menu items that commonly appear in coffee shops / food establishments
COMMON_MENU_CATEGORIES = {
    "coffee": ["espresso", "americano", "latte", "cappuccino", "macchiato", "mocha", "flat white", "cortado", "ristretto", "lungo"],
    "cold_coffee": ["cold brew", "iced latte", "iced americano", "iced cappuccino", "affogato"],
    "tea": ["black tea", "green tea", "herbal tea", "chai", "matcha", "oolong"],
    "pastry": ["croissant", "donut", "muffin", "scone", "biscotti", "danish", "croissant", "pain au chocolat", "bagel"],
    "food": ["sandwich", "burger", "salad", "pasta", "soup", "quiche", "wrap", "panini"],
    "beverage": ["smoothie", "juice", "lemonade", "milkshake", "hot chocolate", "cappuccino"],
}

def extract_menu_from_google_places(competitor: Competitor, api_key: str, db: Session) -> List[MenuItem]:
    """
    Extract menu items from Google Places API for a competitor.
    Google Places API doesn't directly expose menu items, so we infer from:
    - Business description
    - Review content (common items mentioned)
    - Website if available
    
    For now, we'll create a smart inference system.
    """
    created_items = []
    
    try:
        # Try to fetch menu from Google Places API
        url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={competitor.google_place_id}&fields=name,formatted_address,website,reviews&key={api_key}"
        response = requests.get(url, timeout=5)
        
        if response.status_code != 200:
            return created_items
        
        data = response.json()
        place = data.get("result", {})
        reviews = place.get("reviews", [])
        
        # Extract menu items from review text (look for food/drink mentions)
        mentioned_items = set()
        for review in reviews[:10]:  # Check first 10 reviews
            text = review.get("text", "").lower()
            for category, items in COMMON_MENU_CATEGORIES.items():
                for item in items:
                    if item in text:
                        mentioned_items.add((item, category))
        
        # Create menu items
        for item_name, category in mentioned_items:
            # Check if item already exists
            existing = db.query(MenuItem).filter(
                MenuItem.competitor_id == competitor.id,
                MenuItem.item_name.ilike(item_name)
            ).first()
            
            if not existing:
                menu_item = MenuItem(
                    competitor_id=competitor.id,
                    item_name=item_name.title(),
                    category=category,
                    description=None,
                    price=None,
                    review_count=0,
                    sentiment_score=4.0,  # Default positive
                    source="reviews",
                    is_active=True
                )
                db.add(menu_item)
                created_items.append(menu_item)
        
        db.commit()
        
    except Exception as e:
        print(f"Error extracting menu from Google Places for {competitor.name}: {e}")
    
    return created_items

def extract_menu_from_website(competitor: Competitor, db: Session) -> List[MenuItem]:
    """
    Extract menu items from competitor's website (if available).
    This is a simplified version - real implementation would need more robust HTML parsing.
    """
    created_items = []
    
    if not competitor.website:
        return created_items
    
    try:
        # Simple fetch and search for common menu terms
        response = requests.get(competitor.website, timeout=5)
        if response.status_code != 200:
            return created_items
        
        content = response.text.lower()
        
        # Look for common menu items in the website
        found_items = set()
        for category, items in COMMON_MENU_CATEGORIES.items():
            for item in items:
                if item in content:
                    found_items.add((item, category))
        
        # Create menu items
        for item_name, category in found_items:
            existing = db.query(MenuItem).filter(
                MenuItem.competitor_id == competitor.id,
                MenuItem.item_name.ilike(item_name)
            ).first()
            
            if not existing:
                menu_item = MenuItem(
                    competitor_id=competitor.id,
                    item_name=item_name.title(),
                    category=category,
                    description=None,
                    price=None,
                    review_count=0,
                    sentiment_score=4.0,
                    source="website",
                    is_active=True
                )
                db.add(menu_item)
                created_items.append(menu_item)
        
        db.commit()
        
    except Exception as e:
        print(f"Error extracting menu from website {competitor.website}: {e}")
    
    return created_items

def refresh_competitor_menu(competitor_id: int, db: Session, api_key: Optional[str] = None) -> Dict:
    """Refresh menu items for a specific competitor"""
    competitor = db.query(Competitor).filter(Competitor.id == competitor_id).first()
    if not competitor:
        return {"error": "Competitor not found"}
    
    items_created = 0
    
    # Try Google Places extraction
    if api_key and competitor.google_place_id:
        items = extract_menu_from_google_places(competitor, api_key, db)
        items_created += len(items)
    
    # Try website extraction
    items = extract_menu_from_website(competitor, db)
    items_created += len(items)
    
    # Update last fetched time
    competitor.menu_last_fetched = datetime.utcnow()
    db.commit()
    
    return {
        "competitor_id": competitor_id,
        "competitor_name": competitor.name,
        "items_found": items_created,
        "last_updated": competitor.menu_last_fetched.isoformat()
    }

def get_top_menu_items(location_id: int, db: Session, limit: int = 10) -> List[Dict]:
    """Get top menu items across all competitors for a location (by review count)"""
    from sqlalchemy import func, desc
    
    items = db.query(MenuItem).join(Competitor).filter(
        Competitor.location_id == location_id,
        MenuItem.is_active == True
    ).order_by(desc(MenuItem.review_count)).limit(limit).all()
    
    result = []
    for item in items:
        result.append({
            "id": item.id,
            "item_name": item.item_name,
            "category": item.category,
            "competitor_name": item.competitor.name,
            "competitor_id": item.competitor_id,
            "price": item.price,
            "review_count": item.review_count,
            "sentiment_score": item.sentiment_score,
            "source": item.source,
            "detected_date": item.detected_date.isoformat() if item.detected_date else None,
        })
    
    return result

def get_competitor_menu(competitor_id: int, db: Session) -> List[Dict]:
    """Get all menu items for a specific competitor"""
    items = db.query(MenuItem).filter(
        MenuItem.competitor_id == competitor_id,
        MenuItem.is_active == True
    ).order_by(MenuItem.category, MenuItem.item_name).all()
    
    result = []
    for item in items:
        result.append({
            "id": item.id,
            "item_name": item.item_name,
            "category": item.category,
            "price": item.price,
            "review_count": item.review_count,
            "sentiment_score": item.sentiment_score,
            "source": item.source,
            "detected_date": item.detected_date.isoformat() if item.detected_date else None,
        })
    
    return result

def find_menu_gaps(location_id: int, your_menu: List[str], db: Session) -> List[Dict]:
    """
    Find menu items that competitors have but you don't.
    Returns items ranked by popularity (review count).
    """
    # Get all menu items from competitors
    from sqlalchemy import func, desc
    
    competitor_items = db.query(MenuItem).join(Competitor).filter(
        Competitor.location_id == location_id,
        MenuItem.is_active == True
    ).order_by(desc(MenuItem.review_count)).all()
    
    gaps = []
    your_menu_lower = [m.lower() for m in your_menu]
    
    for item in competitor_items:
        if item.item_name.lower() not in your_menu_lower:
            gaps.append({
                "item_name": item.item_name,
                "category": item.category,
                "competitor_name": item.competitor.name,
                "price": item.price,
                "review_count": item.review_count,
                "sentiment_score": item.sentiment_score,
                "action": f"Add '{item.item_name}' - {item.competitor.name} has {item.review_count} reviews on this"
            })
    
    # Sort by review count (most popular items first)
    gaps.sort(key=lambda x: x["review_count"], reverse=True)
    return gaps[:10]  # Top 10 opportunities
