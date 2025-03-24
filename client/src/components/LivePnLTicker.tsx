import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useUser } from '@/contexts/UserContext';
import { Trade } from '@/types';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/solid';

interface PnLUpdate {
  symbol: string;
  type: 'buy' | 'sell';
  timestamp: string;
  profit_loss: number;
  traderName: string;
  isCopy: boolean;
}

const LivePnLTicker: React.FC = () => {
  const [updates, setUpdates] = useState<PnLUpdate[]>([]);
  const [flashItem, setFlashItem] = useState<string | null>(null);
  const { socket } = useSocket();
  const { user } = useUser();
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    const handleTrade = (trade: Trade) => {
      // Only add trades from traders we're following
      if (user?.following?.includes(trade.trader_id)) {
        addUpdate({
          symbol: trade.symbol,
          type: trade.type,
          timestamp: trade.timestamp,
          profit_loss: trade.profit_loss,
          traderName: trade.trader_name,
          isCopy: false
        });
      }
    };

    const handleCopyTrade = (data: {userId: number, trade: Trade}) => {
      const trade = data.trade;
      
      // Always add copy trades as they directly affect us
      addUpdate({
        symbol: trade.symbol,
        type: trade.type,
        timestamp: trade.timestamp,
        profit_loss: trade.profit_loss,
        traderName: trade.trader_name,
        isCopy: true
      });
    };

    // Demo handlers
    const handleDemoTrade = (e: CustomEvent) => {
      handleTrade(e.detail);
    };
    
    const handleDemoCopyTrade = (e: CustomEvent) => {
      handleCopyTrade(e.detail);
    };

    // Register listeners
    socket.on('trade', handleTrade);
    socket.on('copy_trade', handleCopyTrade);
    window.addEventListener('demo:trade', handleDemoTrade as EventListener);
    window.addEventListener('demo:copy_trade', handleDemoCopyTrade as EventListener);
    
    return () => {
      socket.off('trade', handleTrade);
      socket.off('copy_trade', handleCopyTrade);
      window.removeEventListener('demo:trade', handleDemoTrade as EventListener);
      window.removeEventListener('demo:copy_trade', handleDemoCopyTrade as EventListener);
    };
  }, [socket, user]);

  const addUpdate = (update: PnLUpdate) => {
    setUpdates(prev => {
      // Keep last 50 updates, with newest first
      const newUpdates = [update, ...prev].slice(0, 50);
      
      // Set flash effect for the new item
      const updateId = `${update.symbol}-${update.timestamp}`;
      setFlashItem(updateId);
      
      // Clear flash after 2 seconds
      setTimeout(() => setFlashItem(null), 2000);
      
      return newUpdates;
    });
  };

  // Auto-scroll functionality
  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker || updates.length < 5) return;
    
    let scrollAmount = 0;
    const scrollSpeed = 1.5; // pixels per tick
    
    const scroll = () => {
      if (!ticker) return;
      
      scrollAmount += scrollSpeed;
      ticker.scrollLeft = scrollAmount;
      
      // Reset scroll when we reach the end
      if (scrollAmount >= ticker.scrollWidth - ticker.clientWidth) {
        scrollAmount = 0;
      }
    };
    
    const interval = setInterval(scroll, 30);
    
    return () => clearInterval(interval);
  }, [updates.length]);

  if (updates.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-3 h-16 flex items-center justify-center">
        <div className="text-gray-400 text-sm flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
          Waiting for trade data...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-3 h-16 overflow-hidden relative">
      {/* Gradient overlays for smooth scroll effect */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-800 to-transparent z-10"></div>
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-800 to-transparent z-10"></div>
      
      <div
        ref={tickerRef}
        className="flex space-x-6 h-full overflow-x-auto scrollbar-none items-center"
        style={{ scrollBehavior: 'smooth' }}
      >
        {updates.map((update, index) => {
          const updateId = `${update.symbol}-${update.timestamp}`;
          const isHighlighted = updateId === flashItem;
          
          return (
            <div 
              key={`${updateId}-${index}`} 
              className={`flex-shrink-0 px-4 py-2 rounded-lg transition-all duration-300 ${
                isHighlighted ? 'bg-gray-700/70' : 'bg-gray-800'
              } ${update.isCopy ? 'border border-blue-500/30' : ''}`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex flex-col items-center justify-center">
                  <span className={`text-xs ${update.isCopy ? 'text-blue-400' : 'text-gray-400'}`}>
                    {update.isCopy ? 'COPY' : update.traderName}
                  </span>
                  <span className="font-medium text-white">{update.symbol}</span>
                </div>
                
                <div className="flex flex-col">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    update.type === 'buy' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {update.type.toUpperCase()}
                  </span>
                  <span className={`text-sm font-medium ${
                    update.profit_loss >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {update.profit_loss >= 0 ? (
                      <ArrowTrendingUpIcon className="w-3 h-3 inline mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-3 h-3 inline mr-1" />
                    )}
                    {update.profit_loss >= 0 ? '+' : ''}${Math.abs(update.profit_loss).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <style jsx>{`
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default LivePnLTicker;