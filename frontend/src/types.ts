export interface Location {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  created_at: string;
}

export interface CompetitorWithSnapshot {
  id: number;
  location_id: number;
  google_place_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string | null;
  phone: string | null;
  website: string | null;
  distance_km: number | null;
  created_at: string;
  last_updated: string;
  latest_rating: number | null;
  latest_review_count: number | null;
  latest_business_status: string | null;
  reviews_per_week: number | null;
  rating_trend: string | null;
}

export interface CompetitorSnapshot {
  id: number;
  competitor_id: number;
  rating: number | null;
  review_count: number | null;
  price_level: number | null;
  business_status: string | null;
  photos_count: number | null;
  opening_hours: string | null;
  snapshot_date: string;
  reviews_per_week: number | null;
  rating_change: number | null;
}

export interface Alert {
  id: number;
  location_id: number;
  competitor_id: number | null;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  data: string | null;
  is_read: boolean;
  created_at: string;
  location_name: string | null;
  competitor_name: string | null;
}

export interface WeeklyBrief {
  id: number;
  location_id: number;
  week_start: string;
  week_end: string;
  title: string;
  content: string;
  generated_at: string;
  location_name: string | null;
}

export interface DashboardSummary {
  total_locations: number;
  competitors_tracked: number;
  active_alerts: number;
  avg_rating_delta: number;
  my_avg_rating: number;
  competitor_avg_rating: number;
}

export interface CompetitorDetail {
  id: number;
  location_id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string | null;
  distance_km: number | null;
  created_at: string;
  location_name: string | null;
  latest_rating: number | null;
  latest_review_count: number | null;
  latest_business_status: string | null;
  reviews_per_week: number | null;
  price_level: number | null;
}
