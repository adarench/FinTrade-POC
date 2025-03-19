import React, { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useUser } from '@/contexts/UserContext';
import { Trade } from '@/types';
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
  const { user } = useUser();
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'all'>('all');

  // Calculate analytics
  const trades = user?.trades || [];
  
  // Apply time filter
  const filteredTrades = useMemo(() => {
    if (timeFilter === 'all') return trades;
    
    const now = new Date();
    const pastDate = new Date();
    if (timeFilter === '7d') {
      pastDate.setDate(now.getDate() - 7);
    } else if (timeFilter === '30d') {
      pastDate.setDate(now.getDate() - 30);
    }
    
    return trades.filter(trade => new Date(trade.timestamp) >= pastDate);
  }, [trades, timeFilter]);
  
  const totalTrades = filteredTrades.length;
  const winningTrades = filteredTrades.filter((t) => t.profit_loss > 0).length;
  const losingTrades = filteredTrades.filter((t) => t.profit_loss < 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  const totalPnL = filteredTrades.reduce((sum, t) => sum + t.profit_loss, 0);
  const totalWinAmount = filteredTrades.filter((t) => t.profit_loss > 0).reduce((sum, t) => sum + t.profit_loss, 0);
  const totalLossAmount = filteredTrades.filter((t) => t.profit_loss < 0).reduce((sum, t) => sum + t.profit_loss, 0);
  
  const averageWin =
    totalWinAmount / winningTrades || 0;
  const averageLoss =
    totalLossAmount / losingTrades || 0;
  const profitFactor = Math.abs(totalWinAmount / totalLossAmount) || 0;

  // Prepare data for charts
  const dailyPnL = filteredTrades.reduce((acc: { [key: string]: number }, trade) => {
    const date = new Date(trade.timestamp).toLocaleDateString();
    acc[date] = (acc[date] || 0) + trade.profit_loss;
    return acc;
  }, {});

  const chartData = Object.entries(dailyPnL).map(([date, pnl]) => ({
    date,
    pnl,
  }));
  
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
      trade: trade.profit_loss
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
    .map(([symbol, data]) => ({
      symbol,
      count: data.count,
      pnl: data.pnl
    }))
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

  return (
    <Layout title="Analytics">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Trading Analytics</h1>
          
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Win Rate</h3>
            <p className="text-2xl font-bold text-white">{winRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-400 mt-1">
              {winningTrades} / {totalTrades} trades
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Total P&L</h3>
            <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {timeFilter === '7d' ? 'Last 7 days' : timeFilter === '30d' ? 'Last 30 days' : 'All time'}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Average Win/Loss</h3>
            <div className="flex justify-between">
              <div>
                <p className="text-green-500">+${averageWin.toFixed(2)}</p>
                <p className="text-xs text-gray-400">Win</p>
              </div>
              <div>
                <p className="text-red-500">${Math.abs(averageLoss).toFixed(2)}</p>
                <p className="text-xs text-gray-400">Loss</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Profit Factor</h3>
            <p className="text-2xl font-bold text-white">{profitFactor.toFixed(2)}</p>
            <p className="text-sm text-gray-400 mt-1">
              Wins ${totalWinAmount.toFixed(0)} / Losses ${Math.abs(totalLossAmount).toFixed(0)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Daily P&L Chart */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Daily P&L</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
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
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cumulative P&L Chart */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Cumulative P&L</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cumulativeData}>
                  <defs>
                    <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.5rem',
                    }}
                    labelStyle={{ color: '#9CA3AF' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cumulative P&L']}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#3B82F6"
                    fill="url(#cumulativeGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Symbol Performance Chart */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Top Symbols</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={symbolChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                  <XAxis type="number" stroke="#9CA3AF" />
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
                  <Bar dataKey="pnl" name="P&L">
                    {symbolChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#4CAF50' : '#F44336'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Win/Loss Distribution Chart */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Win/Loss Distribution</h2>
            <div className="h-80 flex items-center justify-center">
              {totalTrades > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tradeTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {tradeTypeData.map((entry, index) => (
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

          {/* Time of Day Performance */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Time of Day Performance</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="hour" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
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
                  <Bar dataKey="pnl" name="P&L" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Trades Table */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Recent Trades</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400">
                  <th className="pb-4">Date</th>
                  <th className="pb-4">Symbol</th>
                  <th className="pb-4">Type</th>
                  <th className="pb-4">Price</th>
                  <th className="pb-4">Quantity</th>
                  <th className="pb-4">P&L</th>
                  <th className="pb-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.slice(0, 10).map((trade) => (
                  <tr key={trade.id} className="border-t border-gray-700">
                    <td className="py-4 text-gray-400">
                      {new Date(trade.timestamp).toLocaleDateString()} {new Date(trade.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
                        trade.profit_loss > 0 ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                      }`}>
                        {trade.profit_loss > 0 ? 'WIN' : 'LOSS'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredTrades.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
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
