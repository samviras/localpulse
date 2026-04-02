import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiClient } from '../api';
import type { CompetitorDetail, CompetitorSnapshot, Alert } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function CompetitorProfile() {
  const { id } = useParams();
  const [competitor, setCompetitor] = useState<CompetitorDetail | null>(null);
  const [history, setHistory] = useState<CompetitorSnapshot[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const cid = Number(id);
    Promise.all([apiClient.getCompetitor(cid), apiClient.getCompetitorHistory(cid), apiClient.getAlerts({ limit: 50 })])
      .then(([c, h, a]) => { setCompetitor(c); setHistory(h); setAlerts(a.filter(al => al.competitor_id === cid)); })
      .catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-400">Loading...</p></div>;
  if (!competitor) return <div className="text-red-400">Competitor not found</div>;

  const ratingData = history.map(s => ({ date: format(new Date(s.snapshot_date), 'MMM d'), rating: s.rating }));
  const reviewData = history.map(s => ({ date: format(new Date(s.snapshot_date), 'MMM d'), reviews: s.review_count }));
  const priceLevels = ['', '$', '$$', '$$$', '$$$$'];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
        <div><h2 className="text-2xl font-bold text-white">{competitor.name}</h2><p className="text-gray-400 text-sm">{competitor.address}</p></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Rating', value: competitor.latest_rating ? `⭐ ${competitor.latest_rating}` : '—' },
          { label: 'Reviews', value: competitor.latest_review_count ?? '—' },
          { label: 'Reviews/wk', value: competitor.reviews_per_week?.toFixed(1) ?? '—' },
          { label: 'Price', value: competitor.price_level ? priceLevels[competitor.price_level] : '—' },
          { label: 'Distance', value: competitor.distance_km ? `${competitor.distance_km} km` : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-navy-800 rounded-lg p-4 border border-gray-700/30 text-center">
            <p className="text-xs text-gray-400">{label}</p><p className="text-xl font-bold text-white mt-1">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-sm px-3 py-1 rounded-full font-medium ${competitor.latest_business_status === 'OPERATIONAL' ? 'bg-emerald-500/20 text-emerald-400' : competitor.latest_business_status === 'CLOSED_TEMPORARILY' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
          {competitor.latest_business_status === 'OPERATIONAL' ? '✅ Open' : competitor.latest_business_status === 'CLOSED_TEMPORARILY' ? '⚠️ Temporarily Closed' : '❌ Closed'}
        </span>
        {competitor.location_name && <span className="text-sm text-gray-400">Near: <span className="text-blue-400">{competitor.location_name}</span></span>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-navy-800 rounded-xl p-6 border border-gray-700/30">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Rating Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={ratingData}><XAxis dataKey="date" stroke="#6b7280" fontSize={11} /><YAxis domain={[1, 5]} stroke="#6b7280" fontSize={11} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#e5e7eb' }} />
              <Line type="monotone" dataKey="rating" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-navy-800 rounded-xl p-6 border border-gray-700/30">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Review Count Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={reviewData}><XAxis dataKey="date" stroke="#6b7280" fontSize={11} /><YAxis stroke="#6b7280" fontSize={11} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#e5e7eb' }} />
              <Line type="monotone" dataKey="reviews" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Related Alerts</h3>
          {alerts.map(a => (
            <div key={a.id} className="bg-navy-800 rounded-lg p-4 border border-gray-700/30">
              <div className="flex items-center justify-between"><h4 className="text-sm font-medium text-white">{a.title}</h4><span className="text-xs text-gray-500">{format(new Date(a.created_at), 'MMM d, yyyy')}</span></div>
              <p className="text-sm text-gray-400 mt-1">{a.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
