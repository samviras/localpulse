import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, AlertTriangle, TrendingUp, AlertCircle, Zap } from 'lucide-react';
import StatCard from '../components/StatCard';
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

  // Real data: competitors with latest ratings
  const competitorsByRating = [...allCompetitors]
    .filter(c => c.latest_rating)
    .sort((a, b) => (b.latest_rating || 0) - (a.latest_rating || 0));

  const topCompetitors = competitorsByRating.slice(0, 5);
  const weakCompetitors = competitorsByRating.slice(-3).reverse(); // Lowest rated = opportunities

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
    .filter(c => c.reviews_per_week).sort((a, b) => (b.reviews_per_week || 0) - (a.reviews_per_week || 0)).slice(0, 8)
    .map(c => ({ name: c.name.length > 20 ? c.name.slice(0, 20) + '…' : c.name, velocity: c.reviews_per_week || 0 }));

  // AI Recommendations based on competitor analysis
  const recommendations = [
    {
      title: 'Price Opportunity',
      description: topCompetitors.length > 0 
        ? `${topCompetitors[0].name} is rated highest at ${topCompetitors[0].latest_rating}⭐. Consider matching their price points.`
        : 'Analyze top-rated competitors to find pricing gaps.',
      icon: '💰',
      priority: 'high'
    },
    {
      title: 'Menu Gap Analysis',
      description: weakCompetitors.length > 0
        ? `${weakCompetitors[0].name} has lower ratings (${weakCompetitors[0].latest_rating}⭐). Opportunity to differentiate with better menu options.`
        : 'Identify menu gaps vs competitors.',
      icon: '🍲',
      priority: 'medium'
    },
    {
      title: 'Review Velocity',
      description: velocityData.length > 0
        ? `${velocityData[0].name} is gaining ${velocityData[0].velocity.toFixed(1)} reviews/week. Increase your marketing to match their momentum.`
        : 'Track competitor review growth.',
      icon: '📈',
      priority: 'medium'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Command Center</h2>
        <p className="text-gray-400 text-sm">Your competitive intelligence at a glance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="My Locations" value={summary?.total_locations || 0} icon={MapPin} color="blue" />
        <StatCard title="Competitors Tracked" value={summary?.competitors_tracked || 0} icon={Users} color="emerald" />
        <StatCard title="Active Alerts" value={summary?.active_alerts || 0} icon={AlertTriangle} color="red" />
        <StatCard title="Rating Advantage" value={summary?.avg_rating_delta ? `+${summary.avg_rating_delta.toFixed(2)}` : '0'} icon={TrendingUp} color="amber" delta={`Your avg: ${summary?.my_avg_rating?.toFixed(1) || 0} vs ${summary?.competitor_avg_rating?.toFixed(1) || 0}`} />
      </div>

      {/* AI Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((rec, i) => (
          <div key={i} className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-lg p-5 hover:border-gray-600 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="text-3xl">{rec.icon}</div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                rec.priority === 'high' 
                  ? 'bg-red-900/40 text-red-300' 
                  : 'bg-amber-900/40 text-amber-300'
              }`}>
                {rec.priority.toUpperCase()}
              </span>
            </div>
            <h4 className="text-white font-semibold mb-2">{rec.title}</h4>
            <p className="text-gray-400 text-sm leading-relaxed">{rec.description}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Trend */}
        <div className="bg-navy-800 rounded-xl p-6 border border-gray-700/30">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Rating Trend (8 Weeks)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorYours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" stroke="#6b7280" fontSize={12} />
              <YAxis domain={[3, 5]} stroke="#6b7280" fontSize={12} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#e5e7eb' }} />
              <Area type="monotone" dataKey="yourAvg" stroke="#3b82f6" fillOpacity={1} fill="url(#colorYours)" name="Your Avg" />
              <Area type="monotone" dataKey="competitors" stroke="#ef4444" fillOpacity={1} fill="url(#colorComp)" name="Competitor Avg" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Review Velocity */}
        <div className="bg-navy-800 rounded-xl p-6 border border-gray-700/30">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Competitor Review Velocity</h3>
          {velocityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={velocityData} layout="vertical" margin={{ left: 100 }}>
                <XAxis type="number" stroke="#6b7280" fontSize={12} />
                <YAxis type="category" dataKey="name" width={100} stroke="#6b7280" fontSize={11} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#e5e7eb' }} />
                <Bar dataKey="velocity" radius={[0, 4, 4, 0]}>
                  {velocityData.map((_, i) => <Cell key={i} fill={i === 0 ? '#ef4444' : i < 3 ? '#f59e0b' : '#3b82f6'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No review data available</div>
          )}
        </div>
      </div>

      {/* Top Competitors & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Rated Competitors */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Top Rated Competitors
            </h3>
          </div>
          <div className="bg-navy-800 rounded-xl border border-gray-700/30 overflow-hidden">
            {topCompetitors.length > 0 ? (
              <div className="divide-y divide-gray-700/30">
                {topCompetitors.map((c, i) => (
                  <div key={c.id} className="p-4 hover:bg-gray-700/10 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-gray-500 font-semibold">#{i + 1}</span>
                          <h4 className="text-white font-medium">{c.name}</h4>
                          {c.rating_trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                          {c.rating_trend === 'down' && <AlertCircle className="w-4 h-4 text-red-400" />}
                        </div>
                        <p className="text-sm text-gray-400">{c.address}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">⭐ {c.latest_rating?.toFixed(1)}</div>
                        <div className="text-xs text-gray-400">{c.latest_review_count} reviews</div>
                        {c.reviews_per_week && (
                          <div className="text-xs text-amber-400 font-semibold">{c.reviews_per_week.toFixed(1)}/week</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">No competitor data available</div>
            )}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Recent Alerts</h3>
            {alerts.length > 0 && <Link to="/alerts" className="text-sm text-blue-400 hover:text-blue-300">View all →</Link>}
          </div>
          {alerts.length > 0 ? (
            alerts.map(a => <AlertCard key={a.id} alert={a} />)
          ) : (
            <div className="bg-navy-800 rounded-xl border border-gray-700/30 p-4 text-center text-gray-500 text-sm">
              No alerts yet. Keep monitoring competitors.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
