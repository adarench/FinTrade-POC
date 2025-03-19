import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/solid';

interface MarketDataItem {
  symbol: string;
  price: number;
  change: number;
  volume: number;
  timestamp: string;
}

const MarketTicker: React.FC = () => {
  const [marketData, setMarketData] = useState<{ [symbol: string]: MarketDataItem }>({});
  const [priceFlash, setPriceFlash] = useState<{ [symbol: string]: 'up' | 'down' | null }>({});
  const { socket } = useSocket();
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('market_data', (data: MarketDataItem) => {
      setMarketData(prev => {
        const oldPrice = prev[data.symbol]?.price;
        let direction: 'up' | 'down' | null = null;
        
        if (oldPrice && oldPrice !== data.price) {
          direction = data.price > oldPrice ? 'up' : 'down';
          
          // Flash price change
          setPriceFlash(prevFlash => ({
            ...prevFlash,
            [data.symbol]: direction
          }));
          
          // Clear flash after 1s
          setTimeout(() => {
            setPriceFlash(prevFlash => ({
              ...prevFlash,
              [data.symbol]: null
            }));
          }, 1000);
        }
        
        return {
          ...prev,
          [data.symbol]: data
        };
      });
    });

    return () => {
      socket.off('market_data');
    };
  }, [socket]);

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-400';
  };

  const getFlashColor = (symbol: string) => {
    if (!priceFlash[symbol]) return '';
    return priceFlash[symbol] === 'up' 
      ? 'animate-flash-green'
      : 'animate-flash-red';
  };

  // Auto-scroll functionality
  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker) return;
    
    let scrollAmount = 0;
    const distance = 100;
    
    const scroll = () => {
      if (!ticker) return;
      
      scrollAmount += 1;
      ticker.scrollLeft = scrollAmount;
      
      if (scrollAmount >= ticker.scrollWidth - ticker.clientWidth) {
        scrollAmount = 0;
      }
    };
    
    const interval = setInterval(scroll, 50);
    
    return () => clearInterval(interval);
  }, [Object.keys(marketData).length]);

  if (Object.keys(marketData).length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-2 overflow-hidden">
      <div 
        ref={tickerRef}
        className="flex space-x-6 overflow-x-auto scrollbar-none"
        style={{ scrollBehavior: 'smooth' }}
      >
        {Object.values(marketData).map((item) => (
          <div key={item.symbol} className="flex-shrink-0 px-3 py-2">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-white">{item.symbol}</span>
              <span className={`flex items-center text-sm ${getChangeColor(item.change)}`}>
                {item.change >= 0 ? (
                  <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
                )}
                {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
              </span>
            </div>
            <div className={`text-xl font-semibold mt-1 ${getFlashColor(item.symbol)}`}>
              ${item.price.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">
              Vol: {(item.volume / 1000).toFixed(0)}K
            </div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .animate-flash-green {
          animation: flash-green 1s;
        }
        
        .animate-flash-red {
          animation: flash-red 1s;
        }
        
        @keyframes flash-green {
          0%, 100% { color: white; }
          50% { color: #10B981; }
        }
        
        @keyframes flash-red {
          0%, 100% { color: white; }
          50% { color: #EF4444; }
        }
        
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

export default MarketTicker;