import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Scan, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { apiClient } from '../api';
import CompetitorMap from '../components/CompetitorMap';
import type { Location, CompetitorWithSnapshot } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function LocationDetail() {
  const { id } = useParams();
  const [location, setLocation] = useState<Location | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorWithSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [sortKey, setSortKey] = useState<'name' | 'distance_km' | 'latest_rating' | 'reviews_per_week'>('distance_km');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (!id) return;
    Promise.all([apiClient.getLocations(), apiClient.getLocationCompetitors(Number(id))])
      .then(([locs, comps]) => { setLocation(locs.find(l => l.id === Number(id)) || null); setCompetitors(comps); })
      .catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleScan = async () => {
    if (!id) return;
    setScanning(true);
    try { await apiClient.scanCompetitors(Number(id)); } catch (e) { console.error(e); }
    finally { setTimeout(() => setScanning(false), 2000); }
  };

  const sorted = [...competitors].sort((a, b) => {
    const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0;
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-400">Loading...</p></div>;
  if (!location) return <div className="text-red-400">Location not found</div>;

  const velocityData = competitors.filter(c => c.reviews_per_week).sort((a, b) => (b.reviews_per_week || 0) - (a.reviews_per_week || 0)).slice(0, 8)
    .map(c => ({ name: c.name.length > 20 ? c.name.slice(0, 20) + '…' : c.name, velocity: c.reviews_per_week || 0 }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/locations" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
        <div><h2 className="text-2xl font-bold text-white">{location.name}</h2><p className="text-gray-400 text-sm">{location.address}</p></div>
        <button onClick={handleScan} disabled={scanning} className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Scan className="w-4 h-4" />{scanning ? 'Scanning...' : 'Scan for Competitors'}
        </button>
      </div>
      <div className="bg-navy-800 rounded-xl p-4 border border-gray-700/30">
        <CompetitorMap locations={[location]} competitors={competitors} center={[location.latitude, location.longitude]} zoom={14} showRadius radiusCenter={[location.latitude, location.longitude]} height="350px" />
      </div>
      <div className="bg-navy-800 rounded-xl border border-gray-700/30 overflow-hidden">
        <div className="p-4 border-b border-gray-700/30"><h3 className="text-lg font-semibold text-white">Nearby Competitors ({competitors.length})</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-700/30 text-gray-400">
              {([['name','Name'],['distance_km','Distance'],['latest_rating','Rating'],['reviews_per_week','Reviews/wk']] as const).map(([key,label]) => (
                <th key={key} className="px-4 py-3 text-left cursor-pointer hover:text-white" onClick={() => toggleSort(key)}>{label} {sortKey === key && (sortDir === 'asc' ? '↑' : '↓')}</th>
              ))}
              <th className="px-4 py-3 text-left">Trend</th><th className="px-4 py-3 text-left">Status</th>
            </tr></thead>
            <tbody>{sorted.map(c => (
              <tr key={c.id} className="border-b border-gray-700/20 hover:bg-gray-700/10">
                <td className="px-4 py-3"><Link to={`/competitors/${c.id}`} className="text-white hover:text-blue-400 font-medium">{c.name}</Link></td>
                <td className="px-4 py-3 text-gray-300">{c.distance_km ? `${c.distance_km} km` : '—'}</td>
                <td className="px-4 py-3 text-gray-300">{c.latest_rating ? `⭐ ${c.latest_rating}` : '—'}</td>
                <td className="px-4 py-3 text-gray-300">{c.reviews_per_week?.toFixed(1) || '—'}</td>
                <td className="px-4 py-3">
                  {c.rating_trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                  {c.rating_trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
                  {(c.rating_trend === 'stable' || !c.rating_trend) && <Minus className="w-4 h-4 text-gray-500" />}
                </td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${c.latest_business_status === 'CLOSED_TEMPORARILY' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{c.latest_business_status === 'CLOSED_TEMPORARILY' ? 'Temp. Closed' : 'Open'}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      {velocityData.length > 0 && (
        <div className="bg-navy-800 rounded-xl p-6 border border-gray-700/30">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Review Velocity Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={velocityData} layout="vertical"><XAxis type="number" stroke="#6b7280" fontSize={12} /><YAxis type="category" dataKey="name" width={150} stroke="#6b7280" fontSize={11} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#e5e7eb' }} />
              <Bar dataKey="velocity" radius={[0, 4, 4, 0]}>{velocityData.map((_, i) => <Cell key={i} fill={i === 0 ? '#ef4444' : '#3b82f6'} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
