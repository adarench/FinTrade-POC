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
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Live Trade Feed</h2>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {trades.map((trade) => {
          const tradeId = `${trade.id}-${trade.timestamp}`;
          const isNew = animatedTrades[tradeId];
          
          return (
            <div
              key={tradeId}
              onClick={() => onTradeClick(trade)}
              className={`bg-gray-700 rounded-lg p-4 flex items-center space-x-4 cursor-pointer hover:bg-gray-600 transition-colors ${
                isNew ? 'animate-pulse bg-gray-600' : ''
              }`}
            >
              {/* Trader Info */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden flex-shrink-0">
                  <img
                    src={trade.trader_avatar || '/default-avatar.png'}
                    alt={trade.trader_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-white">{trade.trader_name}</p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Trade Info */}
              <div className="flex-1 text-right">
                <div className="flex items-center justify-end space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    trade.type === 'buy' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                  }`}>
                    {trade.type.toUpperCase()}
                  </span>
                  <span className="text-white font-medium">{trade.symbol}</span>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-sm text-gray-400">
                    {trade.quantity} @ ${trade.price.toFixed(2)}
                  </p>
                  <p className="text-xs font-medium mt-1">
                    {formatTradeAmount(trade)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        {trades.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No trades yet
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTradeFeed;