import React, { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useSocket } from '@/contexts/SocketContext';
import { useTraders } from '@/contexts/TraderContext';
import Layout from '@/components/Layout';
import { Trade } from '@/types';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Import dashboard components
import PortfolioSummary from '@/components/dashboard/PortfolioSummary';
import LiveTradeFeed from '@/components/dashboard/LiveTradeFeed';
import FollowedTraders from '@/components/dashboard/FollowedTraders';
import TopPerformers from '@/components/dashboard/TopPerformers';
import MarketTicker from '@/components/MarketTicker';

const DashboardPage: React.FC = () => {
  const { user, updateUser } = useUser();
  const { socket, isConnected } = useSocket();
  const { traders, followTrader, unfollowTrader } = useTraders();
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [portfolioData, setPortfolioData] = useState({
    balance: 0,
    dailyPnL: 0,
    dailyPnLPercentage: 0,
    chartData: {
      labels: [] as string[],
      values: [] as number[],
    },
  });
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  // Initialize portfolio data
  useEffect(() => {
    if (!user) return;

    const now = new Date();
    const labels = Array.from({ length: 24 }, (_, i) => {
      const d = new Date(now);
      d.setHours(d.getHours() - (23 - i));
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });

    // Use deterministic "random" values to avoid hydration issues
    const baseValue = user.balance;
    const values = labels.map((_, i) => {
      // Use a predictable pattern instead of random
      const change = 0.001 * (i % 5 === 0 ? -1 : 1) * (i + 1);
      return baseValue * (1 + change * i);
    });

    setPortfolioData({
      balance: user.balance,
      dailyPnL: values[values.length - 1] - values[0],
      dailyPnLPercentage: ((values[values.length - 1] - values[0]) / values[0]) * 100,
      chartData: { labels, values },
    });
  }, [user]);

  // Calculate portfolio value based on user trades
  const calculatePortfolioValue = useCallback(() => {
    if (!user || !user.trades || user.trades.length === 0) return user?.balance || 0;
    
    // In a real app, we'd calculate actual portfolio value based on positions
    // For this demo, we'll just use the balance + sum of P&L from today's trades
    const today = new Date().setHours(0, 0, 0, 0);
    const todayTrades = user.trades.filter(trade => {
      const tradeDate = new Date(trade.timestamp);
      return tradeDate.getTime() >= today;
    });
    
    const todayPnL = todayTrades.reduce((sum, trade) => sum + trade.profit_loss, 0);
    return user.balance + todayPnL;
  }, [user]);

  // Listen for trade updates
  useEffect(() => {
    if (!socket || !user) return;

    socket.on('trade', (trade: Trade) => {
      // Add trader name and avatar to trade object if missing
      if (!trade.trader_name) {
        const trader = traders.find(t => t.id === trade.trader_id);
        if (trader) {
          trade.trader_name = trader.name;
          trade.trader_avatar = trader.avatar;
        }
      }
      
      setRecentTrades(prev => [trade, ...prev].slice(0, 20));

      // Update portfolio value if the trade is from a followed trader
      if (user.following.includes(trade.trader_id)) {
        // In a real app, we would apply copy settings here
        if (updateUser) {
          const updatedUser = {
            ...user,
            trades: [...user.trades, {
              ...trade,
              id: Date.now(),
              trader_id: user.id,
              timestamp: new Date().toISOString(),
            }],
            balance: user.balance + trade.profit_loss,
          };
          updateUser(updatedUser);
        }

        setPortfolioData(prev => {
          const newBalance = prev.balance + trade.profit_loss;
          const latestValue = prev.chartData.values[prev.chartData.values.length - 1] + trade.profit_loss;
          
          // Update chart with new value
          const updatedValues = [...prev.chartData.values];
          updatedValues[updatedValues.length - 1] = latestValue;
          
          return {
            balance: newBalance,
            dailyPnL: prev.dailyPnL + trade.profit_loss,
            dailyPnLPercentage: ((latestValue - prev.chartData.values[0]) / prev.chartData.values[0]) * 100,
            chartData: {
              ...prev.chartData,
              values: updatedValues
            }
          };
        });
      }
    });

    // Market data updates to update chart in real-time
    socket.on('market_data', (data: any) => {
      // For simplicity, we'll just update the portfolio value slightly
      // Use data.price to make updates deterministic based on input
      if (data.symbol === 'AAPL') { // Only update on AAPL data to reduce updates
        setPortfolioData(prev => {
          const change = (data.price % 10) / 1000; // Small deterministic change
          const latestValue = prev.chartData.values[prev.chartData.values.length - 1] + change;
          
          // Update chart with new value
          const updatedValues = [...prev.chartData.values];
          updatedValues[updatedValues.length - 1] = latestValue;
          
          return {
            ...prev,
            dailyPnL: latestValue - prev.chartData.values[0],
            dailyPnLPercentage: ((latestValue - prev.chartData.values[0]) / prev.chartData.values[0]) * 100,
            chartData: {
              ...prev.chartData,
              values: updatedValues
            }
          };
        });
      }
    });

    return () => {
      socket.off('trade');
      socket.off('market_data');
    };
  }, [socket, user, traders, updateUser]);

  const handleTradeClick = (trade: Trade) => {
    setSelectedTrade(trade);
    setShowTradeModal(true);
  };

  // Get top performers
  const getTopPerformers = () => {
    if (!traders || traders.length < 3) return { bestDaily: null, steadiest: null, mostCopied: null };

    // Make sure to handle undefined properties safely
    const sortedByDaily = [...traders].sort((a, b) => 
      ((b.daily_return || 0) - (a.daily_return || 0))
    );
    const sortedByConsistency = [...traders].sort((a, b) => 
      ((b.win_rate || 0) - (a.win_rate || 0))
    );
    const sortedByFollowers = [...traders].sort((a, b) => 
      ((b.followers || 0) - (a.followers || 0))
    );

    return {
      bestDaily: sortedByDaily[0] || null,
      steadiest: sortedByConsistency[0] || null,
      mostCopied: sortedByFollowers[0] || null,
    };
  };

  const handleFollow = (traderId: number) => {
    if (!user || !updateUser) return;
    
    // Update user's following list
    const newFollowing = [...user.following];
    if (!newFollowing.includes(traderId)) {
      newFollowing.push(traderId);
      const updatedUser = {
        ...user,
        following: newFollowing
      };
      updateUser(updatedUser);
    }
    
    // Also update traders state via TraderContext
    followTrader(traderId);
  };

  const handleUnfollow = (traderId: number) => {
    if (!user || !updateUser) return;
    
    // Update user's following list
    const updatedUser = {
      ...user,
      following: user.following.filter(id => id !== traderId)
    };
    updateUser(updatedUser);
    
    // Also update traders state via TraderContext
    unfollowTrader(traderId);
  };

  const topPerformers = getTopPerformers();
  const followedTradersList = traders?.filter(t => t && user?.following?.includes(t.id)) || [];

  if (!user) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-400">Please log in to view your dashboard</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="container mx-auto px-4 py-8 space-y-6">

        {/* Market Ticker */}
        <MarketTicker />

        {/* Portfolio Summary */}
        <PortfolioSummary
          balance={portfolioData.balance}
          dailyPnL={portfolioData.dailyPnL}
          dailyPnLPercentage={portfolioData.dailyPnLPercentage}
          chartData={portfolioData.chartData}
        />

        {/* Live Trade Feed */}
        <LiveTradeFeed
          trades={recentTrades}
          onTradeClick={handleTradeClick}
        />

        {/* Followed Traders */}
        {user && (
          <FollowedTraders
            traders={followedTradersList || []}
            onUnfollow={handleUnfollow}
          />
        )}

        {/* Top Performers */}
        {topPerformers.bestDaily && topPerformers.steadiest && topPerformers.mostCopied ? (
          <TopPerformers
            bestDaily={topPerformers.bestDaily}
            steadiest={topPerformers.steadiest}
            mostCopied={topPerformers.mostCopied}
            onFollow={handleFollow}
          />
        ) : (
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <h2 className="text-xl font-semibold text-white mb-4">Top Performers</h2>
            <p className="text-gray-400">Loading top performers data...</p>
          </div>
        )}
      </div>

      {/* Trade Detail Modal */}
      {showTradeModal && selectedTrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Trade Details</h3>
              <button 
                onClick={() => setShowTradeModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gray-600 overflow-hidden">
                  <img
                    src={selectedTrade.trader_avatar || '/default-avatar.png'}
                    alt={selectedTrade.trader_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <Link href={`/traders/${selectedTrade.trader_id}`} className="font-medium text-blue-400 hover:underline">
                    {selectedTrade.trader_name}
                  </Link>
                  <p className="text-sm text-gray-400">
                    {new Date(selectedTrade.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Action</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedTrade.type === 'buy' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                  }`}>
                    {selectedTrade.type.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Symbol</span>
                  <span className="text-white font-medium">{selectedTrade.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Quantity</span>
                  <span className="text-white">{selectedTrade.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Price</span>
                  <span className="text-white">${selectedTrade.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Value</span>
                  <span className="text-white">${(selectedTrade.quantity * selectedTrade.price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">P&L</span>
                  <span className={selectedTrade.profit_loss >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {selectedTrade.profit_loss >= 0 ? '+' : ''}${selectedTrade.profit_loss.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowTradeModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    // Implement copy trade functionality
                    setShowTradeModal(false);
                    // For demo, we'll just log it
                    console.log('Copying trade:', selectedTrade);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  Copy Trade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DashboardPage;