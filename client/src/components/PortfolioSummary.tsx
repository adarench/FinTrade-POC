import React, { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useUser } from '@/contexts/UserContext';
import { Trade } from '@/types';

const PortfolioSummary: React.FC = () => {
  const { socket } = useSocket();
  const { user } = useUser();
  const [recentPnL, setRecentPnL] = useState<number>(0);
  const [showPnLAnimation, setShowPnLAnimation] = useState(false);

  useEffect(() => {
    socket?.on('trade', (trade: Trade) => {
      if (user?.following.includes(trade.trader_id)) {
        const pnlChange = trade.profit_loss;
        setRecentPnL(pnlChange);
        setShowPnLAnimation(true);
        setTimeout(() => setShowPnLAnimation(false), 2000);
      }
    });

    return () => {
      socket?.off('trade');
    };
  }, [socket, user]);

  if (!user) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <p className="text-center text-gray-400">Loading...</p>
      </div>
    );
  }

  const totalBalance = user.balance || 0;
  const totalPnL = user.trades.reduce((sum, trade) => sum + trade.profit_loss, 0);
  const todayPnL = user.trades
    .filter(
      (trade) =>
        new Date(trade.timestamp).toDateString() === new Date().toDateString()
    )
    .reduce((sum, trade) => sum + trade.profit_loss, 0);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">Portfolio Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h3 className="text-gray-400 text-sm mb-2">Total Balance</h3>
          <p className="text-2xl font-bold text-white">
            ${totalBalance.toFixed(2)}
          </p>
        </div>
        
        <div>
          <h3 className="text-gray-400 text-sm mb-2">Total P&L</h3>
          <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${totalPnL.toFixed(2)}
          </p>
        </div>
        
        <div>
          <h3 className="text-gray-400 text-sm mb-2">Today's P&L</h3>
          <div className="flex items-center">
            <p className={`text-2xl font-bold ${todayPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${todayPnL.toFixed(2)}
            </p>
            {showPnLAnimation && (
              <span
                className={`ml-2 text-sm font-medium ${
                  recentPnL >= 0 ? 'text-green-500' : 'text-red-500'
                } animate-fade-out`}
              >
                {recentPnL >= 0 ? '+' : ''}{recentPnL.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSummary;