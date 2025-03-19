import React from 'react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { useSocket } from '@/contexts/SocketContext';

const Navbar: React.FC = () => {
  const { user } = useUser();
  const { isConnected } = useSocket();

  return (
    <nav className="bg-gray-800 py-3 px-4 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/" className="text-2xl font-bold text-primary">
            FinTrade
          </Link>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-700">
            Demo
          </span>
        </div>
        
        <div className="flex items-center space-x-6">
          {/* Socket connection status */}
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-success' : 'bg-danger'}`}></div>
            <span className="text-xs text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          {/* Navigation links */}
          <Link href="/" className="text-gray-300 hover:text-white">
            Dashboard
          </Link>
          <Link href="/traders" className="text-gray-300 hover:text-white">
            Traders
          </Link>
          <Link href="/portfolio" className="text-gray-300 hover:text-white">
            Portfolio
          </Link>
        </div>
        
        {/* User info */}
        <div className="flex items-center">
          {user && (
            <div className="text-right">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-gray-400">Balance: ${user.balance.toLocaleString()}</div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;