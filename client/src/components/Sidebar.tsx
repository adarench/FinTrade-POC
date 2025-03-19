import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  HomeIcon, 
  UserGroupIcon, 
  ChartBarIcon, 
  BriefcaseIcon, 
  CogIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Sidebar: React.FC = () => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const menuItems = [
    { href: '/', label: 'Dashboard', icon: HomeIcon },
    { href: '/traders', label: 'Traders', icon: UserGroupIcon },
    { href: '/portfolio', label: 'Portfolio', icon: BriefcaseIcon },
    { href: '/analytics', label: 'Analytics', icon: ChartBarIcon },
    { href: '/settings', label: 'Settings', icon: CogIcon },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 right-4 z-50 md:hidden bg-gray-800 text-gray-200 p-2 rounded-lg hover:bg-gray-700"
      >
        {isMobileMenuOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <Bars3Icon className="w-6 h-6" />
        )}
      </button>

      {/* Sidebar */}
      <aside className={`
        md:w-64 bg-gray-800 border-r border-gray-700
        fixed md:static inset-y-0 left-0 z-40
        transform transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <nav className="flex flex-col h-full">
          <div className="flex-1 py-6 px-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const isActive = router.pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link 
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
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
          </div>
          
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
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;