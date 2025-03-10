import React from 'react';
import Layout from '@/components/Layout';
import PortfolioSummary from '@/components/PortfolioSummary';
import LiveTradeFeed from '@/components/LiveTradeFeed';
import CopyTradeSettings from '@/components/CopyTradeSettings';
import { useTraders } from '@/contexts/TraderContext';
import { useUser } from '@/contexts/UserContext';
import TraderCard from '@/components/TraderCard';

export default function Home() {
  const { traders, isLoading } = useTraders();
  const { user } = useUser();
  
  // Get followed traders
  const followedTraders = user && traders
    ? traders.filter(trader => user.following.includes(trader.id))
    : [];
  
  // Get top performing traders
  const topTraders = traders
    ? [...traders].sort((a, b) => b.return_30d - a.return_30d).slice(0, 3)
    : [];
  
  return (
    <Layout title="FinTrade - Dashboard">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-400">Welcome to FinTrade Copy Trading Platform</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <PortfolioSummary />
        </div>
        <div>
          <CopyTradeSettings />
        </div>
      </div>
      
      {followedTraders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Traders You Follow</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {followedTraders.map(trader => (
              <TraderCard key={trader.id} trader={trader} />
            ))}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <LiveTradeFeed />
        </div>
        <div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
            
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-16 bg-gray-700 rounded"></div>
                <div className="h-16 bg-gray-700 rounded"></div>
                <div className="h-16 bg-gray-700 rounded"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {topTraders.map(trader => (
                  <div key={trader.id} className="bg-gray-700 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full overflow-hidden relative mr-2">
                          <img 
                            src={trader.profilePic} 
                            alt={trader.name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div>
                          <div className="font-medium">{trader.name}</div>
                          <div className="text-xs text-gray-400">{trader.risk_level} Risk</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-success font-medium">+{trader.return_30d.toFixed(1)}%</div>
                        <div className="text-xs text-gray-400">30-day return</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}