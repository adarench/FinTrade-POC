import React from 'react';
import Layout from '@/components/Layout';
import LeaderboardTable from '@/components/LeaderboardTable';
import { useTraders } from '@/contexts/TraderContext';
import TraderCard from '@/components/TraderCard';

export default function TradersPage() {
  const { traders, isLoading } = useTraders();
  
  return (
    <Layout title="FinTrade - Traders & Leaderboard">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Traders & Leaderboard</h1>
        <p className="text-gray-400">Discover and follow top-performing traders</p>
      </div>
      
      <div className="mb-8">
        <LeaderboardTable />
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">All Traders</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-gray-800 rounded-lg h-64"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {traders.map(trader => (
              <TraderCard key={trader.id} trader={trader} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}