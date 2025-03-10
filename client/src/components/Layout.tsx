import React, { ReactNode } from 'react';
import Head from 'next/head';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import AlertManager from './AlertManager';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title = 'FinTrade - Copy Trading Platform' }) => {
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