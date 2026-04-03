import axios from 'axios';
import type { Location, CompetitorWithSnapshot, CompetitorSnapshot, Alert, WeeklyBrief, DashboardSummary, CompetitorDetail } from './types';

// Use local /api proxy on same origin (Vercel rewrites to Railway backend)
const API_BASE = import.meta.env.VITE_API_URL || '/api';
const api = axios.create({ baseURL: API_BASE });
console.log('LocalPulse API configured:', API_BASE);

export const apiClient = {
  // Auth
  completeOnboarding: (data: any) => api.post('/auth/onboarding', data).then(r => r.data),
  
  // Dashboard
  getDashboardSummary: () => api.get<DashboardSummary>('/dashboard/summary').then(r => r.data),
  
  // Locations
  getLocations: () => api.get<Location[]>('/locations').then(r => r.data),
  getLocationCompetitors: (id: number) => api.get<CompetitorWithSnapshot[]>(`/locations/${id}/competitors`).then(r => r.data),
  scanCompetitors: (id: number) => api.post(`/locations/${id}/scan`).then(r => r.data),
  
  // Competitors
  getCompetitor: (id: number) => api.get<CompetitorDetail>(`/competitors/${id}`).then(r => r.data),
  getCompetitorHistory: (id: number) => api.get<CompetitorSnapshot[]>(`/competitors/${id}/history`).then(r => r.data),
  
  // Alerts
  getAlerts: (params?: Record<string, unknown>) => api.get<Alert[]>('/alerts', { params }).then(r => r.data),
  markAlertRead: (id: number) => api.post(`/alerts/${id}/read`).then(r => r.data),
  
  // Briefs & Recommendations
  getBriefs: (params?: Record<string, unknown>) => api.get<WeeklyBrief[]>('/briefs', { params }).then(r => r.data),
  getBrief: (id: number) => api.get<WeeklyBrief>(`/briefs/${id}`).then(r => r.data),
  generateBrief: (locationId: number) => api.post(`/locations/${locationId}/generate-brief`).then(r => r.data),
  getRecommendations: (locationId: number) => api.get(`/locations/${locationId}/recommendations`).then(r => r.data),
};
