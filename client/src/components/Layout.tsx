import React from 'react';
import Head from 'next/head';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import AlertManager from './AlertManager';
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
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        {!isConnected && (
          <div className="bg-red-900 text-white py-2 px-4 text-center">
            <span className="inline-flex items-center">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
              Disconnected from trading server. Reconnecting...
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
      </div>
    </>
  );
};

export default Layout;