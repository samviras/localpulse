import axios from 'axios';
import type { Location, CompetitorWithSnapshot, CompetitorSnapshot, Alert, WeeklyBrief, DashboardSummary, CompetitorDetail } from './types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const api = axios.create({ baseURL: API_BASE });

export const apiClient = {
  getDashboardSummary: () => api.get<DashboardSummary>('/dashboard/summary').then(r => r.data),
  getLocations: () => api.get<Location[]>('/locations').then(r => r.data),
  getLocationCompetitors: (id: number) => api.get<CompetitorWithSnapshot[]>(`/locations/${id}/competitors`).then(r => r.data),
  scanCompetitors: (id: number) => api.post(`/locations/${id}/scan`).then(r => r.data),
  getCompetitor: (id: number) => api.get<CompetitorDetail>(`/competitors/${id}`).then(r => r.data),
  getCompetitorHistory: (id: number) => api.get<CompetitorSnapshot[]>(`/competitors/${id}/history`).then(r => r.data),
  getAlerts: (params?: Record<string, unknown>) => api.get<Alert[]>('/alerts', { params }).then(r => r.data),
  markAlertRead: (id: number) => api.post(`/alerts/${id}/read`).then(r => r.data),
  getBriefs: (params?: Record<string, unknown>) => api.get<WeeklyBrief[]>('/briefs', { params }).then(r => r.data),
  getBrief: (id: number) => api.get<WeeklyBrief>(`/briefs/${id}`).then(r => r.data),
  generateBrief: (locationId: number) => api.post(`/briefs/generate?location_id=${locationId}`).then(r => r.data),
};
