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
    balance: 100000,
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

  // Force-generate mock trades to ensure we see activity
  useEffect(() => {
    if (!user || !traders || traders.length === 0) return;
    
    // Generate a trade every 3 seconds
    const tradeInterval = setInterval(() => {
      // Select a random trader
      const randomTrader = traders[Math.floor(Math.random() * traders.length)];
      if (!randomTrader) return;
      
      // Random stock symbols
      const symbols = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX', 'DIS'];
      const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      
      // Create a trade
      const trade: Trade = {
        id: Date.now(),
        trader_id: randomTrader.id,
        trader_name: randomTrader.name,
        trader_avatar: randomTrader.avatar || `/avatars/trader${randomTrader.id}.jpg`,
        symbol: randomSymbol,
        type: Math.random() > 0.5 ? 'buy' : 'sell',
        quantity: Math.floor(Math.random() * 50) + 1,
        price: Math.floor(Math.random() * 200) + 50,
        profit_loss: (Math.random() - 0.4) * 100, // Slightly biased toward profit
        timestamp: new Date().toISOString()
      };
      
      // Add to recent trades
      setRecentTrades(prev => [trade, ...prev].slice(0, 20));
      
      // If user is following this trader, create a copy trade
      if (user.following && user.following.includes(trade.trader_id)) {
        // Get user's copy settings for this trader or use default
        const settings = user.copy_settings?.[trade.trader_id] || {
          enabled: true,
          position_size_type: 'fixed',
          position_size: 1000,
          max_position_size: 5000
        };
        
        if (settings.enabled !== false) { // Default to enabled if not specified
          // Calculate quantity based on settings
          let quantity = trade.quantity;
          if (settings.position_size_type === 'fixed') {
            quantity = Math.floor(settings.position_size / trade.price);
          } else if (settings.position_size_type === 'percentage') {
            quantity = Math.floor((user.balance * (settings.position_size / 100)) / trade.price);
          }
          
          // Limit to max position size
          if (settings.max_position_size && quantity * trade.price > settings.max_position_size) {
            quantity = Math.floor(settings.max_position_size / trade.price);
          }
          
          // Create a copy trade
          const copyTrade: Trade = {
            ...trade,
            id: Date.now() + 1,
            trader_id: user.id,
            trader_name: user.name || 'You',
            trader_avatar: user.avatar || '/avatars/default.jpg',
            quantity: quantity > 0 ? quantity : 1,
            profit_loss: (trade.profit_loss / trade.quantity) * (quantity > 0 ? quantity : 1)
          };
          
          // Add to recent trades
          setRecentTrades(prev => [{...copyTrade, isCopy: true} as Trade, ...prev].slice(0, 20));
          
          // Update user's portfolio value
          if (updateUser) {
            updateUser({
              ...user,
              trades: [...(user.trades || []), copyTrade],
              balance: user.balance + copyTrade.profit_loss
            });
          }
          
          // Update portfolio data display
          setPortfolioData(prev => {
            const newBalance = prev.balance + copyTrade.profit_loss;
            const newValues = [...prev.chartData.values];
            if (newValues.length > 0) {
              newValues[newValues.length - 1] = newValues[newValues.length - 1] + copyTrade.profit_loss;
            }
            
            return {
              balance: newBalance,
              dailyPnL: prev.dailyPnL + copyTrade.profit_loss,
              dailyPnLPercentage: prev.dailyPnLPercentage + (copyTrade.profit_loss / prev.balance) * 100,
              chartData: {
                ...prev.chartData,
                values: newValues
              }
            };
          });
        }
      }
    }, 2000); // Generate a trade every 2 seconds
    
    return () => clearInterval(tradeInterval);
  }, [user, traders, updateUser]);

  const handleTradeClick = (trade: Trade) => {
    setSelectedTrade(trade);
    setShowTradeModal(true);
  };

  // Get top performers
  const getTopPerformers = () => {
    if (!traders || traders.length < 3) return { bestDaily: null, steadiest: null, mostCopied: null };

    // Make sure to handle undefined properties safely
    const sortedByDaily = [...traders].sort((a, b) => 
      ((b.monthly_return || 0) - (a.monthly_return || 0))
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
    const newFollowing = [...(user.following || [])];
    if (!newFollowing.includes(traderId)) {
      newFollowing.push(traderId);
      const updatedUser = {
        ...user,
        following: newFollowing,
        // Initialize copy settings if they don't exist
        copy_settings: {
          ...(user.copy_settings || {}),
          [traderId]: {
            enabled: true,
            position_size_type: 'fixed',
            position_size: 1000,
            max_position_size: 5000,
            stop_loss_percentage: 5,
            take_profit_percentage: 10,
            max_daily_loss: 500,
            max_drawdown: 15
          }
        }
      };
      updateUser(updatedUser);
    }
    
    // Also update traders state via TraderContext if needed
    if (followTrader) followTrader(traderId);
  };

  const handleUnfollow = (traderId: number) => {
    if (!user || !updateUser) return;
    
    // Update user's following list
    const updatedUser = {
      ...user,
      following: (user.following || []).filter(id => id !== traderId)
    };
    updateUser(updatedUser);
    
    // Also update traders state via TraderContext if needed
    if (unfollowTrader) unfollowTrader(traderId);
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
                    // Handle copying trade
                    if (selectedTrade && user && updateUser) {
                      // Create a copy of the trade with user as trader
                      const copyTrade: Trade = {
                        ...selectedTrade,
                        id: Date.now(),
                        trader_id: user.id,
                        trader_name: user.name || 'You',
                        trader_avatar: user.avatar || '/avatars/default.jpg',
                        timestamp: new Date().toISOString()
                      };
                      
                      // Add to user's trades and update balance
                      updateUser({
                        ...user,
                        trades: [...(user.trades || []), copyTrade],
                        balance: user.balance + copyTrade.profit_loss
                      });
                      
                      // Add to recent trades feed
                      setRecentTrades(prev => [{...copyTrade, isCopy: true} as Trade, ...prev].slice(0, 20));
                      
                      // Update portfolio data
                      setPortfolioData(prev => ({
                        ...prev,
                        balance: prev.balance + copyTrade.profit_loss,
                        dailyPnL: prev.dailyPnL + copyTrade.profit_loss,
                        dailyPnLPercentage: prev.dailyPnLPercentage + (copyTrade.profit_loss / prev.balance) * 100
                      }));
                      
                      setShowTradeModal(false);
                    }
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