import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'emerald' | 'amber' | 'red';
  delta?: string;
}

const colorMap = {
  blue: 'bg-blue-500/20 text-blue-400',
  emerald: 'bg-emerald-500/20 text-emerald-400',
  amber: 'bg-amber-500/20 text-amber-400',
  red: 'bg-red-500/20 text-red-400',
};

export default function StatCard({ title, value, icon: Icon, color = 'blue', delta }: Props) {
  return (
    <div className="bg-navy-800 rounded-xl p-6 border border-gray-700/30">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400">{title}</span>
        <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      {delta && (
        <p className={clsx('text-sm mt-1', delta.startsWith('+') ? 'text-emerald-400' : delta.startsWith('-') ? 'text-red-400' : 'text-gray-400')}>
          {delta}
        </p>
      )}
    </div>
  );
}
