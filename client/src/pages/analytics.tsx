import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { useUser } from '@/contexts/UserContext';
import { useSocket } from '@/contexts/SocketContext';  
import { Trade } from '@/types';
import LiveTradeFeed from '@/components/dashboard/LiveTradeFeed';
import MarketTicker from '@/components/MarketTicker';
import LivePnLTicker from '@/components/LivePnLTicker';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

const AnalyticsPage: React.FC = () => {
  const { user, updateUser } = useUser();
  const { socket } = useSocket();
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'all'>('all');
  const [liveTrades, setLiveTrades] = useState<Trade[]>([]);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [realtimePnL, setRealtimePnL] = useState<{time: Date, value: number}[]>([]);
  const [latestTradeTimestamp, setLatestTradeTimestamp] = useState<string | null>(null);
  
  // Initialize realtime P&L data
  useEffect(() => {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    
    // Create initial data points for the last 30 minutes (one point per minute)
    const initialData = Array.from({ length: 30 }, (_, i) => {
      const time = new Date(thirtyMinutesAgo.getTime() + i * 60 * 1000);
      return { time, value: 0 };
    });
    
    setRealtimePnL(initialData);
  }, []);
  
  // Process a new trade and update all the analytics data
  const processNewTrade = useCallback((trade: Trade, isCopy: boolean = false) => {
    // Update live trades feed
    setLiveTrades(prev => {
      const newTrade = isCopy ? {...trade, isCopy: true} : trade;
      return [newTrade, ...prev].slice(0, 20);
    });
    
    // Update all trades list - store locally for analytics without affecting user state
    setAllTrades(prev => {
      const newTrade = isCopy ? {...trade, isCopy: true} : trade;
      return [newTrade, ...prev];
    });
    
    // Update the latest trade timestamp for UI indicators
    setLatestTradeTimestamp(trade.timestamp);
    
    // For copy trades, update the realtime P&L chart
    if (isCopy && updateUser && user) {
      // Update realtime P&L data
      setRealtimePnL(prev => {
        const now = new Date();
        const lastValue = prev.length > 0 ? prev[prev.length - 1].value : 0;
        const newValue = lastValue + trade.profit_loss;
        
        // Keep only data points from the last 30 minutes
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
        const filteredData = prev.filter(item => item.time > thirtyMinutesAgo);
        
        return [...filteredData, { time: now, value: newValue }];
      });
      
      // Update user state with the new trade and adjusted balance
      updateUser({
        ...user,
        trades: [...(user.trades || []), trade],
        balance: user.balance + trade.profit_loss
      });
    }
  }, [updateUser, user]);

  // Set up socket listeners for live trades
  useEffect(() => {
    if (!socket) return;

    // Handle regular trade events
    const handleTrade = (trade: Trade) => {
      // Process trades from traders the user is following
      const isDemo = window.location.search.includes('demo=true') || !socket?.connected;
      if (isDemo || user?.following?.includes(trade.trader_id)) {
        processNewTrade(trade);
      }
    };

    // Handle copy trade events (these directly affect the user's portfolio)
    const handleCopyTrade = (data: {userId: number, trade: Trade}) => {
      processNewTrade(data.trade, true);
    };

    // Custom event handlers for demo mode
    const handleDemoTrade = (e: CustomEvent) => {
      handleTrade(e.detail);
    };
    
    const handleDemoCopyTrade = (e: CustomEvent) => {
      handleCopyTrade(e.detail);
    };

    // Register event listeners
    socket.on('trade', handleTrade);
    socket.on('copy_trade', handleCopyTrade);
    window.addEventListener('demo:trade', handleDemoTrade as EventListener);
    window.addEventListener('demo:copy_trade', handleDemoCopyTrade as EventListener);
    
    // Clean up on unmount
    return () => {
      socket.off('trade', handleTrade);
      socket.off('copy_trade', handleCopyTrade);
      window.removeEventListener('demo:trade', handleDemoTrade as EventListener);
      window.removeEventListener('demo:copy_trade', handleDemoCopyTrade as EventListener);
    };
  }, [socket, user, processNewTrade]);

  // Calculate analytics - combine user trades with local allTrades for real-time analytics
  const trades = user?.trades || [];
  
  // Apply time filter
  const filteredTrades = useMemo(() => {
    // Combine user's historical trades with recent trades that might not be in user state yet
    const combinedTrades = [...trades, ...allTrades.filter(
      t => !trades.some(ut => ut.id === t.id && ut.timestamp === t.timestamp)
    )];
    
    if (timeFilter === 'all') return combinedTrades;
    
    const now = new Date();
    const pastDate = new Date();
    if (timeFilter === '7d') {
      pastDate.setDate(now.getDate() - 7);
    } else if (timeFilter === '30d') {
      pastDate.setDate(now.getDate() - 30);
    }
    
    return combinedTrades.filter(trade => new Date(trade.timestamp) >= pastDate);
  }, [trades, allTrades, timeFilter]);
  
  // Memoize analytics calculations to avoid recomputing on every render
  const analytics = useMemo(() => {
    const totalTrades = filteredTrades.length;
    const winningTrades = filteredTrades.filter((t) => t.profit_loss > 0).length;
    const losingTrades = filteredTrades.filter((t) => t.profit_loss < 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    const totalPnL = filteredTrades.reduce((sum, t) => sum + t.profit_loss, 0);
    const totalWinAmount = filteredTrades.filter((t) => t.profit_loss > 0).reduce((sum, t) => sum + t.profit_loss, 0);
    const totalLossAmount = filteredTrades.filter((t) => t.profit_loss < 0).reduce((sum, t) => sum + t.profit_loss, 0);
    
    const averageWin = totalWinAmount / winningTrades || 0;
    const averageLoss = totalLossAmount / losingTrades || 0;
    const profitFactor = Math.abs(totalWinAmount / totalLossAmount) || 0;

    // Prepare data for daily P&L chart
    const dailyPnL = filteredTrades.reduce((acc: { [key: string]: number }, trade) => {
      const date = new Date(trade.timestamp).toLocaleDateString();
      acc[date] = (acc[date] || 0) + trade.profit_loss;
      return acc;
    }, {});

    const chartData = Object.entries(dailyPnL)
      .map(([date, pnl]) => ({ date, pnl }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate cumulative P&L data
    const sortedTrades = [...filteredTrades].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    const cumulativeData = sortedTrades.reduce((acc: any[], trade, index) => {
      const date = new Date(trade.timestamp).toLocaleDateString();
      const prevCumulative = index > 0 ? acc[index - 1].cumulative : 0;
      const cumulative = prevCumulative + trade.profit_loss;
      
      acc.push({
        date,
        cumulative,
        trade: trade.profit_loss,
        time: new Date(trade.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      });
      
      return acc;
    }, []);
    
    // Calculate trade performance by symbol
    const symbolPerformance = filteredTrades.reduce((acc: {[key: string]: {count: number, pnl: number}}, trade) => {
      if (!acc[trade.symbol]) {
        acc[trade.symbol] = { count: 0, pnl: 0 };
      }
      
      acc[trade.symbol].count += 1;
      acc[trade.symbol].pnl += trade.profit_loss;
      
      return acc;
    }, {});
    
    const symbolChartData = Object.entries(symbolPerformance)
      .map(([symbol, data]) => ({ symbol, count: data.count, pnl: data.pnl }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Trade types distribution for pie chart
    const tradeTypeData = [
      { name: 'Winning', value: winningTrades, color: '#4CAF50' },
      { name: 'Losing', value: losingTrades, color: '#F44336' },
    ];
    
    // Time of day performance
    const hourlyPerformance = filteredTrades.reduce((acc: {[key: number]: {count: number, pnl: number}}, trade) => {
      const hour = new Date(trade.timestamp).getHours();
      
      if (!acc[hour]) {
        acc[hour] = { count: 0, pnl: 0 };
      }
      
      acc[hour].count += 1;
      acc[hour].pnl += trade.profit_loss;
      
      return acc;
    }, {});
    
    const hourlyChartData = Array.from({ length: 24 }, (_, hour) => {
      const data = hourlyPerformance[hour] || { count: 0, pnl: 0 };
      return {
        hour: `${hour}:00`,
        pnl: data.pnl,
        count: data.count
      };
    });
    
    return {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      totalPnL,
      totalWinAmount,
      totalLossAmount,
      averageWin,
      averageLoss,
      profitFactor,
      chartData,
      cumulativeData,
      symbolChartData,
      tradeTypeData,
      hourlyChartData
    };
  }, [filteredTrades]);
  
  // Convert real-time P&L data for the chart
  const realtimeChartData = useMemo(() => {
    return realtimePnL.map(item => ({
      time: item.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'}),
      value: item.value
    }));
  }, [realtimePnL]);

  return (
    <Layout title="Analytics">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Market Ticker */}
        <MarketTicker />
      
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-white">Trading Analytics</h1>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full ${latestTradeTimestamp ? 'bg-green-500 animate-pulse' : 'bg-gray-500'} mr-2`}></div>
              <span className="text-xs text-gray-300">
                {latestTradeTimestamp 
                  ? `Last update: ${new Date(latestTradeTimestamp).toLocaleTimeString([],{hour: '2-digit', minute:'2-digit', second:'2-digit'})}`
                  : 'Waiting for data...'}
              </span>
            </div>
            
            <div className="bg-gray-800 rounded-lg flex p-1">
              <button 
                className={`px-3 py-1 rounded-md ${timeFilter === '7d' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                onClick={() => setTimeFilter('7d')}
              >
                7D
              </button>
              <button 
                className={`px-3 py-1 rounded-md ${timeFilter === '30d' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                onClick={() => setTimeFilter('30d')}
              >
                30D
              </button>
              <button 
                className={`px-3 py-1 rounded-md ${timeFilter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                onClick={() => setTimeFilter('all')}
              >
                All
              </button>
            </div>
          </div>
        </div>
        
        {/* Live P&L Ticker */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <h2 className="text-lg font-semibold text-white">Live P&L Ticker</h2>
            <div className="flex items-center ml-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
              <span className="text-xs text-gray-400">LIVE</span>
            </div>
          </div>
          <LivePnLTicker />
        </div>

        {/* Real-time P&L Tracking */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Real-time Copy Trading P&L</h2>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm text-gray-400">LIVE</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={realtimeChartData}>
                <defs>
                  <linearGradient id="liveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  stroke="#9CA3AF"
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{ color: '#9CA3AF' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'P&L']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fill="url(#liveGradient)"
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Win Rate</h3>
            <p className="text-2xl font-bold text-white">{analytics.winRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-400 mt-1">
              {analytics.winningTrades} / {analytics.totalTrades} trades
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Total P&L</h3>
            <p className={`text-2xl font-bold ${analytics.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {analytics.totalPnL >= 0 ? '+' : ''}{analytics.totalPnL.toFixed(2)}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {timeFilter === '7d' ? 'Last 7 days' : timeFilter === '30d' ? 'Last 30 days' : 'All time'}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Average Win/Loss</h3>
            <div className="flex justify-between">
              <div>
                <p className="text-green-500">+${analytics.averageWin.toFixed(2)}</p>
                <p className="text-xs text-gray-400">Win</p>
              </div>
              <div>
                <p className="text-red-500">${Math.abs(analytics.averageLoss).toFixed(2)}</p>
                <p className="text-xs text-gray-400">Loss</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Profit Factor</h3>
            <p className="text-2xl font-bold text-white">{analytics.profitFactor.toFixed(2)}</p>
            <p className="text-sm text-gray-400 mt-1">
              Wins ${analytics.totalWinAmount.toFixed(0)} / Losses ${Math.abs(analytics.totalLossAmount).toFixed(0)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Daily P&L Chart */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Daily P&L</h2>
              <div className="flex items-center">
                {latestTradeTimestamp && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                )}
                <span className="text-xs text-gray-400">Auto-updating</span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.chartData}>
                  <defs>
                    <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis 
                    stroke="#9CA3AF" 
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.5rem',
                    }}
                    labelStyle={{ color: '#9CA3AF' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'P&L']}
                  />
                  <Area
                    type="monotone"
                    dataKey="pnl"
                    stroke="#4CAF50"
                    fill="url(#pnlGradient)"
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cumulative P&L Chart */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Cumulative P&L</h2>
              <div className="flex items-center">
                {latestTradeTimestamp && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                )}
                <span className="text-xs text-gray-400">Auto-updating</span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.cumulativeData}>
                  <defs>
                    <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                  />
                  <YAxis 
                    stroke="#9CA3AF" 
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.5rem',
                    }}
                    labelStyle={{ color: '#9CA3AF' }}
                    formatter={(value: number, name: string, props: any) => {
                      const entry = props.payload;
                      if (name === 'cumulative') {
                        return [`$${value.toFixed(2)}`, 'Cumulative P&L'];
                      }
                      return [value, name];
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#3B82F6"
                    fill="url(#cumulativeGradient)"
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Live Trade Feed */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Live Trade Feed</h2>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-sm text-gray-400">LIVE</span>
                <span className="ml-2 text-xs text-gray-500">({liveTrades.length} trades)</span>
              </div>
            </div>
            <div className="h-80">
              <LiveTradeFeed
                trades={liveTrades}
                onTradeClick={(trade) => console.log('Trade clicked:', trade)}
              />
            </div>
          </div>
          
          {/* Symbol Performance Chart */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Top Symbols</h2>
              {latestTradeTimestamp && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-xs text-gray-400">Auto-updating</span>
                </div>
              )}
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.symbolChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                  <XAxis 
                    type="number" 
                    stroke="#9CA3AF"
                    tickFormatter={(value) => `$${value.toFixed(0)}`} 
                  />
                  <YAxis dataKey="symbol" type="category" stroke="#9CA3AF" width={50} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.5rem',
                    }}
                    labelStyle={{ color: '#9CA3AF' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'pnl') return [`$${value.toFixed(2)}`, 'P&L'];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="pnl" name="P&L" isAnimationActive={true}>
                    {analytics.symbolChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#4CAF50' : '#F44336'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Win/Loss Distribution Chart */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Win/Loss Distribution</h2>
              {latestTradeTimestamp && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-xs text-gray-400">Auto-updating</span>
                </div>
              )}
            </div>
            <div className="h-80 flex items-center justify-center">
              {analytics.totalTrades > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.tradeTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      isAnimationActive={true}
                    >
                      {analytics.tradeTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '0.5rem',
                      }}
                      formatter={(value: number, name: string) => [value, name]}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400">No trades in the selected period</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Time of Day Performance Chart */}  
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Time of Day Performance</h2>
            {latestTradeTimestamp && (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-xs text-gray-400">Auto-updating</span>
              </div>
            )}
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.hourlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" stroke="#9CA3AF" />
                <YAxis 
                  stroke="#9CA3AF" 
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{ color: '#9CA3AF' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'pnl') return [`$${value.toFixed(2)}`, 'P&L'];
                    return [value, 'Trades'];
                  }}
                />
                <Bar dataKey="pnl" name="P&L" fill="#3B82F6" isAnimationActive={true} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Trades Table */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Recent Trades</h2>
            {latestTradeTimestamp && (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-xs text-gray-400">Auto-updating</span>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400">
                  <th className="pb-4">Date</th>
                  <th className="pb-4">Trader</th>
                  <th className="pb-4">Symbol</th>
                  <th className="pb-4">Type</th>
                  <th className="pb-4">Price</th>
                  <th className="pb-4">Quantity</th>
                  <th className="pb-4">P&L</th>
                  <th className="pb-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.slice(0, 15).map((trade, index) => {
                  const isNew = trade.timestamp === latestTradeTimestamp;
                  return (
                    <tr 
                      key={`${trade.id}-${index}`} 
                      className={`border-t border-gray-700 ${isNew ? 'bg-blue-900/10' : ''} transition-colors duration-300`}
                    >
                      <td className="py-4 text-gray-400">
                        {new Date(trade.timestamp).toLocaleDateString()} {new Date(trade.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="py-4 text-gray-300">
                        {trade.trader_name}
                        {(trade as any).isCopy && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-blue-500/30 text-blue-300">
                            COPY
                          </span>
                        )}
                      </td>
                      <td className="py-4 font-medium text-white">{trade.symbol}</td>
                      <td className={`py-4 ${trade.type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                        {trade.type.toUpperCase()}
                      </td>
                      <td className="py-4">${trade.price.toFixed(2)}</td>
                      <td className="py-4">{trade.quantity}</td>
                      <td className={`py-4 ${trade.profit_loss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trade.profit_loss >= 0 ? '+' : ''}${trade.profit_loss.toFixed(2)}
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          trade.profit_loss >= 0 ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                        }`}>
                          {trade.profit_loss >= 0 ? 'WIN' : 'LOSS'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredTrades.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
                      No trades in the selected time period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AnalyticsPage;
