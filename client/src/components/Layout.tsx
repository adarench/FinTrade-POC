import React from 'react';
import Head from 'next/head';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import AlertManager from './AlertManager';
import CopyTradeStatus from './CopyTradeStatus';
import { useSocket } from '@/contexts/SocketContext';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title = 'FinTrade - Copy Trading Platform' }) => {
  const { isConnected } = useSocket();
  
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="High-frequency copy trading platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white overflow-hidden relative">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full filter blur-3xl"></div>
          <div className="absolute top-60 -left-40 w-80 h-80 bg-purple-600 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-40 right-20 w-80 h-80 bg-green-600 rounded-full filter blur-3xl"></div>
        </div>
        
        <Navbar />
        {!isConnected && (
          <div className="relative bg-gradient-to-r from-amber-700 to-red-700 text-white py-2 px-4 text-center shadow-lg">
            <span className="inline-flex items-center font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-300 mr-2 animate-pulse"></span>
              FinTrade is running in demo mode. Real-time data connection unavailable.
            </span>
          </div>
        )}
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
            {children}
          </main>
        </div>
        <AlertManager />
        <CopyTradeStatus />
      </div>
    </>
  );
};

export default Layout;