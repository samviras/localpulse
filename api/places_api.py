"""
Google Places API integration for real coffee shop data.
Install: pip install google-maps-services
"""

import os
import googlemaps
from typing import List, Dict
from datetime import datetime

class PlacesAPIClient:
    """Client for Google Places API to find real coffee shops and competitors."""
    
    def __init__(self, api_key: str = None):
        """
        Initialize with Google Places API key.
        
        Args:
            api_key: Google Cloud Places API key (or set GOOGLE_PLACES_API_KEY env var)
        """
        self.api_key = api_key or os.getenv("GOOGLE_PLACES_API_KEY")
        if not self.api_key:
            raise ValueError(
                "Google Places API key required. Set GOOGLE_PLACES_API_KEY env var "
                "or pass api_key parameter."
            )
        self.client = googlemaps.Client(key=self.api_key)
    
    def find_coffee_shops(
        self,
        location: tuple = (49.2827, -123.1207),  # Vancouver downtown
        radius: int = 5000,  # 5km
        query: str = "coffee shop"
    ) -> List[Dict]:
        """
        Find coffee shops in a location.
        
        Args:
            location: Tuple of (latitude, longitude)
            radius: Search radius in meters
            query: Search query (coffee shop, cafe, etc.)
        
        Returns:
            List of place data dicts with name, address, rating, lat/lng, place_id
        """
        try:
            places = self.client.places_nearby(
                location=location,
                radius=radius,
                keyword=query,
                type="cafe"
            )
            
            results = []
            for place in places.get("results", []):
                results.append({
                    "name": place.get("name"),
                    "address": place.get("formatted_address"),
                    "latitude": place.get("geometry", {}).get("location", {}).get("lat"),
                    "longitude": place.get("geometry", {}).get("location", {}).get("lng"),
                    "rating": place.get("rating"),
                    "review_count": place.get("user_ratings_total", 0),
                    "place_id": place.get("place_id"),
                    "business_status": place.get("business_status", "OPERATIONAL"),
                    "types": place.get("types", []),
                })
            
            return results
        
        except Exception as e:
            print(f"Error finding coffee shops: {e}")
            return []
    
    def find_competitors(
        self,
        location: tuple,
        radius: int = 500,  # 500m around a specific shop
    ) -> List[Dict]:
        """
        Find nearby competitors (other cafes) around a specific location.
        
        Args:
            location: Tuple of (latitude, longitude)
            radius: Search radius in meters (default 500m)
        
        Returns:
            List of competitor place data
        """
        return self.find_coffee_shops(location=location, radius=radius, query="cafe")
    
    def get_place_details(self, place_id: str) -> Dict:
        """
        Get detailed information about a specific place.
        
        Args:
            place_id: Google Place ID
        
        Returns:
            Detailed place information including reviews, photos, hours
        """
        try:
            place = self.client.place(place_id)
            result = place.get("result", {})
            
            return {
                "name": result.get("name"),
                "address": result.get("formatted_address"),
                "phone": result.get("formatted_phone_number"),
                "website": result.get("website"),
                "rating": result.get("rating"),
                "review_count": result.get("user_ratings_total"),
                "opening_hours": result.get("opening_hours"),
                "photos": result.get("photos", []),
                "reviews": result.get("reviews", []),
                "types": result.get("types", []),
                "business_status": result.get("business_status"),
            }
        
        except Exception as e:
            print(f"Error getting place details: {e}")
            return {}
    
    def get_reviews(self, place_id: str) -> List[Dict]:
        """
        Get reviews for a specific place.
        
        Args:
            place_id: Google Place ID
        
        Returns:
            List of reviews with rating, text, author
        """
        try:
            place = self.client.place(place_id)
            reviews = place.get("result", {}).get("reviews", [])
            
            return [
                {
                    "author": r.get("author_name"),
                    "rating": r.get("rating"),
                    "text": r.get("text"),
                    "time": r.get("time"),
                }
                for r in reviews
            ]
        
        except Exception as e:
            print(f"Error getting reviews: {e}")
            return []


# Example usage
if __name__ == "__main__":
    # Initialize with API key
    places = PlacesAPIClient()
    
    # Find coffee shops in Vancouver downtown
    print("Finding coffee shops in Vancouver...")
    coffee_shops = places.find_coffee_shops(
        location=(49.2827, -123.1207),  # Vancouver downtown
        radius=5000,
        query="coffee shop"
    )
    
    print(f"\nFound {len(coffee_shops)} coffee shops:")
    for shop in coffee_shops[:5]:
        print(f"  - {shop['name']}: {shop['rating']} ⭐ ({shop['review_count']} reviews)")
    
    # Find competitors around first shop
    if coffee_shops:
        first_shop = coffee_shops[0]
        print(f"\nFinding competitors near {first_shop['name']}...")
        competitors = places.find_competitors(
            location=(first_shop['latitude'], first_shop['longitude']),
            radius=500
        )
        
        print(f"Found {len(competitors)} nearby cafes:")
        for comp in competitors[:3]:
            print(f"  - {comp['name']}: {comp['rating']} ⭐")
