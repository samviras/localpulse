import { useState, useEffect } from 'react';
import { apiClient } from '../api';
import AlertCard from '../components/AlertCard';
import type { Alert, Location } from '../types';

const alertTypes = ['', 'NEW_COMPETITOR', 'RATING_DROP', 'RATING_JUMP', 'REVIEW_SURGE', 'COMPETITOR_CLOSED'];
const severities = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filters, setFilters] = useState({ alert_type: '', severity: '', location_id: '', is_read: '' });

  const fetchAlerts = async () => {
    const params: Record<string, unknown> = { limit: 50 };
    if (filters.alert_type) params.alert_type = filters.alert_type;
    if (filters.severity) params.severity = filters.severity;
    if (filters.location_id) params.location_id = Number(filters.location_id);
    if (filters.is_read === 'true') params.is_read = true;
    if (filters.is_read === 'false') params.is_read = false;
    try { setAlerts(await apiClient.getAlerts(params)); } catch (e) { console.error(e); }
  };

  useEffect(() => { apiClient.getLocations().then(setLocations).catch(console.error).finally(() => setLoading(false)); }, []);
  useEffect(() => { fetchAlerts(); }, [filters]);

  const handleMarkRead = async (id: number) => { await apiClient.markAlertRead(id); setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a)); };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-400">Loading alerts...</p></div>;
  const sel = "bg-navy-800 border border-gray-700/30 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500";

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-white mb-1">Alerts</h2><p className="text-gray-400 text-sm">Competitive events requiring your attention</p></div>
      <div className="flex flex-wrap gap-3">
        <select className={sel} value={filters.alert_type} onChange={e => setFilters(f => ({ ...f, alert_type: e.target.value }))}><option value="">All Types</option>{alertTypes.filter(Boolean).map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}</select>
        <select className={sel} value={filters.severity} onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}><option value="">All Severities</option>{severities.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}</select>
        <select className={sel} value={filters.location_id} onChange={e => setFilters(f => ({ ...f, location_id: e.target.value }))}><option value="">All Locations</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
        <select className={sel} value={filters.is_read} onChange={e => setFilters(f => ({ ...f, is_read: e.target.value }))}><option value="">All</option><option value="false">Unread</option><option value="true">Read</option></select>
      </div>
      <div className="space-y-3">
        {alerts.length === 0 && <p className="text-gray-500 text-center py-8">No alerts match your filters</p>}
        {alerts.map(a => <AlertCard key={a.id} alert={a} expanded={expandedId === a.id} onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)} onMarkRead={() => handleMarkRead(a.id)} />)}
      </div>
    </div>
  );
}
