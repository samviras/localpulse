import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { apiClient } from '../api';
import type { WeeklyBrief } from '../types';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

export default function BriefDetail() {
  const { id } = useParams();
  const [brief, setBrief] = useState<WeeklyBrief | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) apiClient.getBrief(Number(id)).then(setBrief).catch(console.error).finally(() => setLoading(false)); }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-400">Loading brief...</p></div>;
  if (!brief) return <div className="text-red-400">Brief not found</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link to="/briefs" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h2 className="text-2xl font-bold text-white">{brief.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-400">{format(new Date(brief.week_start), 'MMM d')} — {format(new Date(brief.week_end), 'MMM d, yyyy')}</span>
            {brief.location_name && <span className="text-sm text-blue-400">· {brief.location_name}</span>}
          </div>
        </div>
      </div>
      <div className="bg-navy-800 rounded-xl p-8 border border-gray-700/30 prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-li:text-gray-300 prose-a:text-blue-400">
        <ReactMarkdown>{brief.content}</ReactMarkdown>
      </div>
    </div>
  );
}
