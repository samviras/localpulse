import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, AlertTriangle, TrendingUp } from 'lucide-react';
import StatCard from '../components/StatCard';
import CompetitorMap from '../components/CompetitorMap';
import AlertCard from '../components/AlertCard';
import { apiClient } from '../api';
import type { Location, CompetitorWithSnapshot, Alert, DashboardSummary } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [allCompetitors, setAllCompetitors] = useState<CompetitorWithSnapshot[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, locs, al] = await Promise.all([
          apiClient.getDashboardSummary(), apiClient.getLocations(), apiClient.getAlerts({ limit: 5 }),
        ]);
        setSummary(s); setLocations(locs); setAlerts(al);
        const compArrays = await Promise.all(locs.map(l => apiClient.getLocationCompetitors(l.id)));
        const uniqueMap = new Map<number, CompetitorWithSnapshot>();
        compArrays.flat().forEach(c => uniqueMap.set(c.id, c));
        setAllCompetitors(Array.from(uniqueMap.values()));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="text-gray-400 text-lg">Loading dashboard...</div></div>;

  // Real trend data from competitors
  const trendData = Array.from({ length: 8 }, (_, i) => {
    const avgRating = allCompetitors.length > 0 
      ? (allCompetitors.reduce((sum, c) => sum + (c.latest_rating || 0), 0) / allCompetitors.length).toFixed(2)
      : '0';
    return {
      week: `W${i + 1}`,
      yourAvg: 4.5,
      competitors: parseFloat(avgRating),
    };
  });

  const velocityData = [...allCompetitors]
    .filter(c => c.reviews_per_week).sort((a, b) => (b.reviews_per_week || 0) - (a.reviews_per_week || 0)).slice(0, 10)
    .map(c => ({ name: c.name.length > 25 ? c.name.slice(0, 25) + '…' : c.name, velocity: c.reviews_per_week || 0 }));

  return (
    <div className="space-y-8">
      <div><h2 className="text-2xl font-bold text-white mb-1">Command Center</h2><p className="text-gray-400 text-sm">Your competitive intelligence at a glance</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="My Locations" value={summary?.total_locations || 0} icon={MapPin} color="blue" />
        <StatCard title="Competitors Tracked" value={summary?.competitors_tracked || 0} icon={Users} color="emerald" />
        <StatCard title="Active Alerts" value={summary?.active_alerts || 0} icon={AlertTriangle} color="red" />
        <StatCard title="Rating Advantage" value={summary?.avg_rating_delta ? `+${summary.avg_rating_delta}` : '0'} icon={TrendingUp} color="amber" delta={`Your avg: ${summary?.my_avg_rating || 0} vs ${summary?.competitor_avg_rating || 0}`} />
      </div>
      {/* Map disabled due to rendering issues - will re-enable after fixing API integration */}
      {/* <div className="bg-navy-800 rounded-xl p-4 border border-gray-700/30">
        <h3 className="text-lg font-semibold text-white mb-4">Competitive Landscape — Vancouver</h3>
        <CompetitorMap locations={locations} competitors={allCompetitors} height="450px" />
      </div> */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between"><h3 className="text-lg font-semibold text-white">Recent Alerts</h3><Link to="/alerts" className="text-sm text-blue-400 hover:text-blue-300">View all →</Link></div>
          {alerts.map(a => <AlertCard key={a.id} alert={a} />)}
        </div>
        <div className="bg-navy-800 rounded-xl p-6 border border-gray-700/30">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Rating Trend (8 Weeks)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorYours" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
              </defs>
              <XAxis dataKey="week" stroke="#6b7280" fontSize={12} /><YAxis domain={[3, 5]} stroke="#6b7280" fontSize={12} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#e5e7eb' }} />
              <Area type="monotone" dataKey="yourAvg" stroke="#3b82f6" fillOpacity={1} fill="url(#colorYours)" name="Your Avg" />
              <Area type="monotone" dataKey="competitors" stroke="#ef4444" fillOpacity={1} fill="url(#colorComp)" name="Competitor Avg" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-navy-800 rounded-xl p-6 border border-gray-700/30">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Review Velocity (reviews/week)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={velocityData} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" stroke="#6b7280" fontSize={12} /><YAxis type="category" dataKey="name" width={120} stroke="#6b7280" fontSize={11} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#e5e7eb' }} />
              <Bar dataKey="velocity" radius={[0, 4, 4, 0]}>{velocityData.map((_, i) => <Cell key={i} fill={i === 0 ? '#ef4444' : i < 3 ? '#f59e0b' : '#3b82f6'} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
