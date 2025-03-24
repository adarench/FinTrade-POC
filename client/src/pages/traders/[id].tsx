import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTraders } from '@/contexts/TraderContext';
import { useUser } from '@/contexts/UserContext';
import { useSocket } from '@/contexts/SocketContext';
import Layout from '@/components/Layout';
import { Trade, CopySettings, Trader } from '@/types';

interface ChartData {
  timestamp: string;
  value: number;
}

const TraderDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { traders } = useTraders();
  const { user, updateUser } = useUser();
  const { socket, startCopyTrading, stopCopyTrading, copyPortfolioOnce } = useSocket();
  
  const [performanceData, setPerformanceData] = useState<ChartData[]>([]);
  const [copySettings, setCopySettings] = useState<CopySettings>({
    enabled: false,
    position_size_type: 'fixed',
    position_size: 100,
    max_position_size: 1000,
    stop_loss_percentage: 5,
    take_profit_percentage: 10,
    max_daily_loss: 500,
    max_drawdown: 20,
    // Backward compatibility
    sizeType: 'fixed',
    size: 100,
    stopLoss: 5,
    takeProfit: 10,
    maxDrawdown: 20,
    maxPositionSize: 1000
  });

  const trader = traders?.find(t => t.id === Number(id));
  const isFollowing = user?.following.includes(Number(id));

  useEffect(() => {
    if (!trader) return;

    // Initialize performance data from trader's trades
    const data = trader.trades.map(trade => ({
      timestamp: trade.timestamp,
      value: trade.profit_loss
    }));
    setPerformanceData(data);

    // Load copy settings if they exist
    if (user?.copy_settings?.[trader.id]) {
      setCopySettings(user.copy_settings[trader.id]);
    }
  }, [trader, user]);

  // For UI notifications
  const [tradeNotification, setTradeNotification] = useState<{
    show: boolean;
    message: string;
    type: 'original' | 'copy';
  }>({
    show: false,
    message: '',
    type: 'original'
  });

  useEffect(() => {
    if (!socket || !trader) return;

    // When the trader makes a trade
    const handleTrade = (trade: Trade) => {
      if (trade.trader_id === trader.id) {
        // Update the performance chart
        setPerformanceData(prev => {
          const newData = {
            timestamp: trade.timestamp,
            value: trade.profit_loss
          };
          return [...prev, newData].slice(-50); // Keep last 50 data points
        });

        // Show a notification
        setTradeNotification({
          show: true,
          message: `${trader.name} ${trade.type === 'buy' ? 'bought' : 'sold'} ${trade.quantity} ${trade.symbol} @ $${trade.price.toFixed(2)}`,
          type: 'original'
        });

        // Hide after 5 seconds
        setTimeout(() => {
          setTradeNotification(prev => ({ ...prev, show: false }));
        }, 5000);
      }
    };

    // When your copy trading executes
    const handleCopyTrade = (data: {userId: number, trade: Trade}) => {
      // Check if this copy trade is related to this trader
      if (data.trade.trader_id === trader.id) {
        // Show a notification
        setTradeNotification({
          show: true,
          message: `You copied ${trader.name}'s trade: ${data.trade.type === 'buy' ? 'bought' : 'sold'} ${data.trade.quantity} ${data.trade.symbol} @ $${data.trade.price.toFixed(2)}`,
          type: 'copy'
        });

        // Hide after 5 seconds
        setTimeout(() => {
          setTradeNotification(prev => ({ ...prev, show: false }));
        }, 5000);
      }
    };

    socket.on('trade', handleTrade);
    socket.on('copy_trade', handleCopyTrade);

    return () => {
      socket.off('trade', handleTrade);
      socket.off('copy_trade', handleCopyTrade);
    };
  }, [socket, trader]);

  const handleFollow = () => {
    if (!user || !updateUser || !trader) return;

    const newFollowing = isFollowing
      ? user.following.filter(id => id !== trader.id)
      : [...user.following, trader.id];

    updateUser({
      ...user,
      following: newFollowing
    });
  };

  const handleCopySettingsChange = (field: keyof CopySettings, value: number | string | boolean) => {
    setCopySettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStartCopying = () => {
    if (!trader) return;
    startCopyTrading(trader.id, copySettings);
  };

  const handleStopCopying = () => {
    if (!trader) return;
    stopCopyTrading(trader.id);
  };

  const handleCopyOnce = () => {
    if (!trader) return;
    copyPortfolioOnce(trader.id, copySettings);
  };

  if (!trader) {
    return (
      <Layout title="Trader Not Found">
        <div className="text-center text-gray-400 mt-8">
          Trader not found
        </div>
      </Layout>
    );
  }

  const calculateMetrics = (trades: Trade[]) => {
    if (trades.length === 0) return { winRate: 0, avgWin: 0, avgLoss: 0, profitFactor: 0 };

    const wins = trades.filter(t => t.profit_loss > 0);
    const losses = trades.filter(t => t.profit_loss < 0);
    
    const winRate = (wins.length / trades.length) * 100;
    const avgWin = wins.length > 0 
      ? wins.reduce((sum, t) => sum + t.profit_loss, 0) / wins.length 
      : 0;
    const avgLoss = losses.length > 0
      ? Math.abs(losses.reduce((sum, t) => sum + t.profit_loss, 0)) / losses.length
      : 0;
    const profitFactor = avgLoss !== 0 ? avgWin / avgLoss : 0;

    return { winRate, avgWin, avgLoss, profitFactor };
  };

  const metrics = calculateMetrics(trader.trades);

  return (
    <Layout title={`Trader - ${trader.name}`}>
      {/* Trade notifications */}
      {tradeNotification.show && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ease-in-out transform translate-y-0 ${
          tradeNotification.type === 'original' ? 'bg-gray-800' : 'bg-blue-900'
        }`}>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-3 animate-pulse ${
              tradeNotification.type === 'original' ? 'bg-green-500' : 'bg-blue-500'
            }`}></div>
            <p className="text-white">{tradeNotification.message}</p>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        {/* Trader Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{trader.name}</h1>
            <p className="text-gray-400">{trader.description}</p>
            <div className="mt-4 flex items-center space-x-4">
              <span className="text-gray-400">
                {trader.followers.toLocaleString()} followers
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-400">
                Joined {trader.joined_date ? new Date(trader.joined_date).toLocaleDateString() : new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleFollow}
              className={`px-4 py-2 rounded-lg transition-colors duration-150 ${
                isFollowing
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Monthly Return</h3>
            <p className={`text-2xl font-bold ${
              trader.monthly_return >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {trader.monthly_return >= 0 ? '+' : ''}{trader.monthly_return.toFixed(2)}%
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Win Rate</h3>
            <p className="text-2xl font-bold text-white">
              {metrics.winRate.toFixed(1)}%
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Profit Factor</h3>
            <p className="text-2xl font-bold text-white">
              {metrics.profitFactor.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Risk Level</h3>
            <p className={`text-2xl font-bold ${
              trader.risk_level === 'Low' ? 'text-green-400' :
              trader.risk_level === 'Medium' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {trader.risk_level}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Chart */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Performance</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34D399" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#34D399" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="timestamp"
                      tick={{ fill: '#9CA3AF' }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis 
                      tick={{ fill: '#9CA3AF' }}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'P&L']}
                      labelFormatter={(label) => new Date(label).toLocaleString()}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#34D399"
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Copy Trading Settings */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Copy Trading Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Position Size Type
                </label>
                <select
                  value={copySettings.sizeType}
                  onChange={(e) => handleCopySettingsChange('sizeType', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="fixed">Fixed Size ($)</option>
                  <option value="percentage">Portfolio %</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {copySettings.sizeType === 'fixed' ? 'Fixed Size ($)' : 'Portfolio %'}
                </label>
                <input
                  type="number"
                  value={copySettings.size}
                  onChange={(e) => handleCopySettingsChange('size', Number(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Stop Loss (%)
                </label>
                <input
                  type="number"
                  value={copySettings.stopLoss}
                  onChange={(e) => handleCopySettingsChange('stopLoss', Number(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Take Profit (%)
                </label>
                <input
                  type="number"
                  value={copySettings.takeProfit}
                  onChange={(e) => handleCopySettingsChange('takeProfit', Number(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Max Drawdown (%)
                </label>
                <input
                  type="number"
                  value={copySettings.maxDrawdown}
                  onChange={(e) => handleCopySettingsChange('maxDrawdown', Number(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Max Position Size ($)
                </label>
                <input
                  type="number"
                  value={copySettings.maxPositionSize}
                  onChange={(e) => handleCopySettingsChange('maxPositionSize', Number(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 space-y-3">
                <button
                  onClick={copySettings.enabled ? handleStopCopying : handleStartCopying}
                  className={`w-full px-4 py-2 rounded-lg transition-colors duration-150 ${
                    copySettings.enabled
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white`}
                >
                  {copySettings.enabled ? 'Stop Copying' : 'Start Copying'}
                </button>
                <button
                  onClick={handleCopyOnce}
                  className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-150"
                >
                  Copy Portfolio Once
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Trades</h2>
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Symbol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">P&L</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {trader.trades.slice().reverse().map((trade) => (
                    <tr key={`${trade.id}-${trade.timestamp}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(trade.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {trade.symbol}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        trade.type === 'buy' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trade.type.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {trade.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        ${trade.price.toFixed(2)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        trade.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        ${trade.profit_loss.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TraderDetailPage;