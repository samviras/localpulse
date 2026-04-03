import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calendar } from 'lucide-react';
import { apiClient } from '../api';
import type { WeeklyBrief } from '../types';
import { format } from 'date-fns';

export default function Briefs() {
  const [briefs, setBriefs] = useState<WeeklyBrief[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { apiClient.getBriefs().then(setBriefs).catch(console.error).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-400">Loading briefs...</p></div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-white mb-1">Weekly Briefs</h2><p className="text-gray-400 text-sm">Automated competitive analysis reports</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {briefs.map(b => (
          <Link key={b.id} to={`/briefs/${b.id}`} className="bg-navy-800 rounded-xl p-6 border border-gray-700/30 hover:border-blue-500/50 transition-colors group">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5 text-blue-400" /></div>
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">{b.title}</h3>
                {b.location_name && <p className="text-sm text-gray-400 mt-1">{b.location_name}</p>}
                <div className="flex items-center gap-2 mt-3"><Calendar className="w-4 h-4 text-gray-500" /><span className="text-xs text-gray-500">{format(new Date(b.week_start), 'MMM d')} — {format(new Date(b.week_end), 'MMM d, yyyy')}</span></div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {briefs.length === 0 && <p className="text-gray-500 text-center py-8">No briefs generated yet</p>}
    </div>
  );
}
