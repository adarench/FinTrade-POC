import React, { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useTraders } from '@/contexts/TraderContext';
import { Trade } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

const LiveTradeFeed: React.FC = () => {
  const { socket } = useSocket();
  const { traders } = useTraders();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [newTradeHighlight, setNewTradeHighlight] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('trade', (trade: Trade) => {
      setTrades(prev => [trade, ...prev].slice(0, 50)); // Keep last 50 trades
      const tradeId = `${trade.trader_id}-${trade.timestamp}`;
      setNewTradeHighlight(tradeId);
      setTimeout(() => setNewTradeHighlight(null), 1000);
    });

    return () => {
      socket.off('trade');
    };
  }, [socket]);

  if (!trades.length) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 h-full flex items-center justify-center">
        <p className="text-gray-400 text-sm">No trades yet. Waiting for data...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 overflow-hidden">
      <h3 className="text-lg font-semibold mb-4">Live Trade Feed</h3>
      
      <div className="overflow-y-auto max-h-[400px] pr-2 space-y-2">
        {trades.map((trade, index) => {
          const tradeId = `${trade.trader_id}-${trade.timestamp}`;
          const isHighlighted = tradeId === newTradeHighlight;
          const trader = traders?.find((t) => t.id === trade.trader_id);
          const traderName = trader ? trader.name : `Trader #${trade.trader_id}`;
          const isBuy = trade.type === 'buy';

          return (
            <div 
              key={tradeId}
              className={`transform transition-all duration-300 ${
                isHighlighted ? 'scale-102 -translate-y-1' : ''
              }`}
            >
              <div className={`py-3 px-4 rounded-lg border border-gray-700 ${
                isHighlighted ? 'bg-gray-700/50' : 'bg-gray-800'
              } transition-colors duration-300`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center mb-1">
                      <span className="font-medium">{traderName}</span>
                      <span className={`ml-2 ${isBuy ? 'text-green-500' : 'text-red-500'} text-xs px-2 py-1 rounded-full ${isBuy ? 'bg-green-500/10' : 'bg-red-500/10'} inline-flex items-center`}>
                        {isBuy ? 'BUY' : 'SELL'}
                      </span>
                    </div>
                    
                    <div className="text-sm">
                      <span className="text-gray-300">{trade.symbol}</span>
                      <span className="mx-2 text-gray-500">•</span>
                      <span>{trade.quantity} @ ${trade.price.toFixed(2)}</span>
                    </div>
                    
                    <div className="mt-1 flex items-center text-sm">
                      <span className="text-gray-400">Value: ${trade.price.toFixed(2)}</span>
                      <span className="mx-2 text-gray-500">•</span>
                      <span className={trade.profit_loss >= 0 ? 'text-green-500' : 'text-red-500'}>
                        P&L: ${trade.profit_loss.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-gray-400 mb-1">
                      {formatDistanceToNow(new Date(trade.timestamp))} ago
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveTradeFeed;