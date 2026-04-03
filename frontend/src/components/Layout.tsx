import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MapPin, AlertTriangle, FileText, Search, UtensilsCrossed } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiClient } from '../api';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/locations', icon: MapPin, label: 'My Locations' },
  { to: '/menu', icon: UtensilsCrossed, label: 'Menu Ideas' },
  { to: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  { to: '/briefs', icon: FileText, label: 'Weekly Briefs' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    apiClient.getAlerts({ is_read: false, limit: 100 }).then(a => setAlertCount(a.length)).catch(() => {});
  }, []);

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-navy-800 border-r border-gray-700/50 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">LocalPulse</h1>
              <p className="text-xs text-gray-400">Competitive Intel</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
              {label === 'Alerts' && alertCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{alertCount}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700/50">
          <p className="text-xs text-gray-500 text-center">LocalPulse v1.0</p>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-navy-900 p-8">{children}</main>
    </div>
  );
}
