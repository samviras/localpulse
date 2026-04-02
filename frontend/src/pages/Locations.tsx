import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Star } from 'lucide-react';
import { apiClient } from '../api';
import type { Location } from '../types';

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [compCounts, setCompCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const locs = await apiClient.getLocations();
        setLocations(locs);
        const counts: Record<number, number> = {};
        await Promise.all(locs.map(async l => { const c = await apiClient.getLocationCompetitors(l.id); counts[l.id] = c.length; }));
        setCompCounts(counts);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-400">Loading locations...</p></div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-white mb-1">My Locations</h2><p className="text-gray-400 text-sm">Manage and monitor your business locations</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map(loc => (
          <Link key={loc.id} to={`/locations/${loc.id}`} className="bg-navy-800 rounded-xl p-6 border border-gray-700/30 hover:border-blue-500/50 transition-colors group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center"><MapPin className="w-5 h-5 text-blue-400" /></div>
              <span className="text-xs text-gray-500 bg-gray-700/30 px-2 py-1 rounded-full">{loc.category}</span>
            </div>
            <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">{loc.name}</h3>
            <p className="text-sm text-gray-400 mt-1">{loc.address}</p>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-700/30">
              <div className="flex items-center gap-1.5"><Users className="w-4 h-4 text-gray-500" /><span className="text-sm text-gray-300">{compCounts[loc.id] || 0} competitors</span></div>
              <div className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400" /><span className="text-sm text-gray-300">{(4.0 + loc.id * 0.1).toFixed(1)}</span></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
