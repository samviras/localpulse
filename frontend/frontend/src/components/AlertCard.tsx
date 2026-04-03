import clsx from 'clsx';
import type { Alert } from '../types';
import { formatDistanceToNow } from 'date-fns';

const typeIcons: Record<string, string> = {
  NEW_COMPETITOR: '🆕', RATING_JUMP: '📈', RATING_DROP: '📉', REVIEW_SURGE: '🚀', COMPETITOR_CLOSED: '🔒',
};

const severityColors: Record<string, string> = {
  LOW: 'border-l-emerald-500', MEDIUM: 'border-l-amber-500', HIGH: 'border-l-orange-500', CRITICAL: 'border-l-red-500',
};

interface Props {
  alert: Alert;
  expanded?: boolean;
  onToggle?: () => void;
  onMarkRead?: () => void;
}

export default function AlertCard({ alert, expanded, onToggle, onMarkRead }: Props) {
  return (
    <div
      className={clsx('bg-navy-800 rounded-lg border-l-4 p-4 cursor-pointer transition-colors hover:bg-navy-700', severityColors[alert.severity] || 'border-l-gray-500', alert.is_read && 'opacity-60')}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-xl">{typeIcons[alert.alert_type] || '⚡'}</span>
          <div>
            <h4 className="text-sm font-semibold text-white">{alert.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              {alert.location_name && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{alert.location_name}</span>}
              <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
        <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full',
          alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
          alert.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
          alert.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
        )}>{alert.severity}</span>
      </div>
      {expanded && (
        <div className="mt-3 pl-10">
          <p className="text-sm text-gray-300 leading-relaxed">{alert.description}</p>
          {!alert.is_read && onMarkRead && (
            <button onClick={e => { e.stopPropagation(); onMarkRead(); }} className="mt-2 text-xs text-blue-400 hover:text-blue-300">Mark as read</button>
          )}
        </div>
      )}
    </div>
  );
}
