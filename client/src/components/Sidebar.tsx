import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  HomeIcon, 
  UserGroupIcon, 
  ChartBarIcon, 
  BriefcaseIcon, 
  CogIcon 
} from '@heroicons/react/24/outline';

const Sidebar: React.FC = () => {
  const router = useRouter();
  
  const menuItems = [
    { href: '/', label: 'Dashboard', icon: HomeIcon },
    { href: '/traders', label: 'Traders', icon: UserGroupIcon },
    { href: '/portfolio', label: 'Portfolio', icon: BriefcaseIcon },
    { href: '/analytics', label: 'Analytics', icon: ChartBarIcon },
    { href: '/settings', label: 'Settings', icon: CogIcon },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-gray-800 border-r border-gray-700">
      <div className="flex flex-col flex-1 overflow-y-auto">
        <nav className="flex-1 py-6 px-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-primary text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-2">Live Data (Simulated)</div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs">AAPL</span>
            <span className="text-xs text-success">$186.20</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs">NVDA</span>
            <span className="text-xs text-success">$920.50</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs">TSLA</span>
            <span className="text-xs text-danger">$820.45</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;