import React from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useTraders } from '@/contexts/TraderContext';
import { Trade } from '@/types';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

const LiveTradeFeed: React.FC = () => {
  const { liveTrades } = useSocket();
  const { getTraderById } = useTraders();

  if (liveTrades.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 h-full flex items-center justify-center">
        <p className="text-gray-400 text-sm">No trades yet. Waiting for data...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 overflow-hidden">
      <h3 className="text-lg font-semibold mb-4">Live Trade Feed</h3>
      
      <div className="overflow-y-auto max-h-[400px] pr-2">
        {liveTrades.map((trade, index) => (
          <TradeItem key={`${trade.trader_id}-${trade.timestamp}-${index}`} trade={trade} />
        ))}
      </div>
    </div>
  );
};

const TradeItem: React.FC<{ trade: Trade }> = ({ trade }) => {
  const { getTraderById } = useTraders();
  const trader = getTraderById(trade.trader_id);
  const traderName = trader ? trader.name : `Trader #${trade.trader_id}`;
  
  const isBuy = trade.action === 'BUY';
  const actionColor = isBuy ? 'text-success' : 'text-danger';
  const actionBg = isBuy ? 'bg-success/10' : 'bg-danger/10';
  const ActionIcon = isBuy ? ArrowUpIcon : ArrowDownIcon;

  // Format timestamp
  const formattedTime = new Date(trade.timestamp).toLocaleTimeString();
  
  return (
    <div className="py-3 border-b border-gray-700 last:border-none">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center mb-1">
            <span className="font-medium">{traderName}</span>
            <span className={`ml-2 ${actionColor} text-xs px-2 py-1 rounded-full ${actionBg} inline-flex items-center`}>
              <ActionIcon className="w-3 h-3 mr-1" />
              {trade.action}
            </span>
          </div>
          
          <div className="text-sm">
            <span className="text-gray-300">{trade.ticker}</span>
            <span className="mx-2 text-gray-500">•</span>
            <span>{trade.size} shares @ ${trade.price.toFixed(2)}</span>
            <span className="mx-2 text-gray-500">•</span>
            <span className="text-gray-400 text-xs">${(trade.price * trade.size).toLocaleString()}</span>
          </div>
        </div>
        
        <div className="text-xs text-gray-400">
          {formattedTime}
        </div>
      </div>
    </div>
  );
};

export default LiveTradeFeed;