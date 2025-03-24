import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trade } from '@/types';

interface LiveTradeFeedProps {
  trades: Trade[];
  onTradeClick: (trade: Trade) => void;
}

const LiveTradeFeed: React.FC<LiveTradeFeedProps> = ({ trades, onTradeClick }) => {
  const [animatedTrades, setAnimatedTrades] = useState<{ [key: string]: boolean }>({});
  
  // Animation effect when new trades arrive
  useEffect(() => {
    if (trades.length === 0) return;
    
    // Mark the newest trade as animated
    const latestTradeId = `${trades[0].id}-${trades[0].timestamp}`;
    setAnimatedTrades(prev => ({ ...prev, [latestTradeId]: true }));
    
    // Remove animation after 1 second
    const timer = setTimeout(() => {
      setAnimatedTrades(prev => {
        const updated = { ...prev };
        delete updated[latestTradeId];
        return updated;
      });
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [trades]);

  // Format trade amount with proper sign and color
  const formatTradeAmount = (trade: Trade) => {
    const amount = trade.quantity * trade.price;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 shadow-xl border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Live Trade Feed</h2>
        <div className="flex items-center">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
          <span className="text-xs font-medium text-gray-400">LIVE</span>
        </div>
      </div>
      <div className="space-y-2.5 max-h-[28rem] overflow-y-auto pr-2 custom-scrollbar">
        {trades.map((trade) => {
          const tradeId = `${trade.id}-${trade.timestamp}`;
          const isNew = animatedTrades[tradeId];
          
          return (
            <div
              key={tradeId}
              onClick={() => onTradeClick(trade)}
              className={`bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 flex items-center space-x-4 cursor-pointer hover:bg-gray-700/80 transition-all duration-200 ${
                isNew ? 'animate-pulse-fast shadow-lg shadow-blue-500/10 border-blue-500/30' : ''
              } ${
                (trade as any).isCopy ? 'bg-blue-900/20 border-blue-500/30' : ''
              }`}
            >
              {/* Trader Info */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden flex-shrink-0 border-2 border-gray-600">
                  <img
                    src={trade.trader_avatar || '/default-avatar.png'}
                    alt={trade.trader_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=250';
                    }}
                  />
                </div>
                <div>
                  <div className="flex items-center">
                    <p className="font-medium text-white">{trade.trader_name}</p>
                    {(trade as any).isCopy && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-blue-500/30 text-blue-300">
                        COPY
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Trade Info */}
              <div className="flex-1 text-right">
                <div className="flex items-center justify-end space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium shadow-sm ${
                    trade.type === 'buy' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {trade.type.toUpperCase()}
                  </span>
                  <span className="text-white font-semibold bg-gray-700/50 px-2 py-1 rounded">
                    {trade.symbol}
                  </span>
                </div>
                <div className="flex flex-col items-end mt-1">
                  <p className="text-sm text-gray-300 font-medium">
                    {trade.quantity.toLocaleString()} @ ${trade.price.toFixed(2)}
                  </p>
                  <p className="text-xs font-medium mt-1 text-gray-400">
                    {formatTradeAmount(trade)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        {trades.length === 0 && (
          <div className="text-center py-12 px-4 border border-dashed border-gray-700 rounded-lg">
            <svg className="w-12 h-12 mx-auto text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-gray-400 font-medium">Waiting for trades to appear</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTradeFeed;