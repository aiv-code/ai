import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  History,
  Settings as SettingsIcon,
  HelpCircle,
  Shield,
} from 'lucide-react';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/data-sources', icon: Database, label: 'Data Sources' },
  { path: '/history', icon: History, label: 'Query History' },
  { path: '/settings', icon: SettingsIcon, label: 'Settings' },
  { path: '/help', icon: HelpCircle, label: 'Help' },
  { path: '/admin', icon: Shield, label: 'Admin' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Analytics Platform</h1>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                    ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}


