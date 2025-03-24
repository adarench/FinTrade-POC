import React from 'react';
import { Trader } from '@/types';
import Link from 'next/link';

interface FollowedTradersProps {
  traders: Trader[];
  onUnfollow: (traderId: number) => void;
}

const FollowedTraders: React.FC<FollowedTradersProps> = ({ traders, onUnfollow }) => {
  const getRiskColor = (riskLevel?: string) => {
    if (!riskLevel) return 'bg-gray-900 text-gray-200';
    
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return 'bg-green-900 text-green-200';
      case 'medium':
        return 'bg-yellow-900 text-yellow-200';
      case 'high':
        return 'bg-red-900 text-red-200';
      default:
        return 'bg-gray-900 text-gray-200';
    }
  };

  const getTradeFrequency = (trades?: any[]) => {
    if (!trades || !Array.isArray(trades) || trades.length < 2) return 'Low';
    
    try {
      // Calculate average trades per day based on first and last trade
      const firstTrade = new Date(trades[trades.length - 1]?.timestamp || Date.now());
      const lastTrade = new Date(trades[0]?.timestamp || Date.now());
      const daysDiff = Math.max(1, (lastTrade.getTime() - firstTrade.getTime()) / (1000 * 60 * 60 * 24));
      const tradesPerDay = trades.length / daysDiff;
      
      if (tradesPerDay < 5) return 'Low';
      if (tradesPerDay < 15) return 'Medium';
      return 'High';
    } catch (error) {
      // In case of any errors, fallback to 'Low'
      return 'Low';
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Followed Traders</h2>
      {traders.length > 0 ? (
        <div className="relative">
          <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {traders.filter(trader => trader && typeof trader === 'object').map((trader) => (
              <div
                key={trader.id || Math.random().toString()}
                className="flex-shrink-0 w-64 bg-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <Link href={`/traders/${trader.id}`} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden">
                      <img
                        src={trader.avatar || '/default-avatar.png'}
                        alt={trader.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-white">{trader.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRiskColor(trader.risk_level)}`}>
                        {trader.risk_level} Risk
                      </span>
                    </div>
                  </Link>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-400">30-Day Return</p>
                      <p className={`text-sm font-semibold ${
                        (trader.monthly_return || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {(trader.monthly_return || 0) >= 0 ? '+' : ''}{(trader.monthly_return || 0).toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Win Rate</p>
                      <p className="text-sm font-semibold text-blue-400">
                        {trader.win_rate ? trader.win_rate.toFixed(1) : '0.0'}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Trade Frequency</p>
                      <p className="text-sm font-semibold text-gray-300">
                        {getTradeFrequency(trader.trades)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Followers</p>
                      <p className="text-sm font-semibold text-gray-300">
                        {(trader.followers || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onUnfollow(trader.id)}
                    className="w-full px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm"
                  >
                    Unfollow
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Gradient fade effect for scroll */}
          <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-gray-800 pointer-events-none" />
        </div>
      ) : (
        <div className="bg-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-400 mb-4">You're not following any traders yet</p>
          <Link href="/traders" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors inline-block">
            Discover Traders
          </Link>
        </div>
      )}
    </div>
  );
};

export default FollowedTraders;