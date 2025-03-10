import React from 'react';
import Layout from '@/components/Layout';
import PortfolioSummary from '@/components/PortfolioSummary';
import { useUser } from '@/contexts/UserContext';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/solid';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Generate mock chart data for portfolio
const generatePortfolioData = () => {
  const data = [];
  const baseValue = 50000;
  let currentValue = baseValue;
  
  // Generate daily data for the past 30 days
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Calculate daily change
    const volatility = 0.015; // 1.5% daily volatility
    const trend = 0.003; // 0.3% daily uptrend
    const change = currentValue * (trend + (Math.random() - 0.5) * volatility);
    currentValue += change;
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: currentValue,
    });
  }
  
  return data;
};

export default function PortfolioPage() {
  const { user } = useUser();
  const portfolioData = generatePortfolioData();
  
  if (!user) {
    return (
      <Layout title="FinTrade - Portfolio">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-800 rounded mb-6"></div>
          <div className="h-48 bg-gray-800 rounded"></div>
        </div>
      </Layout>
    );
  }
  
  const hasPositions = user.portfolio.length > 0;
  
  return (
    <Layout title="FinTrade - Your Portfolio">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Portfolio</h1>
        <p className="text-gray-400">Manage your holdings and view your performance</p>
      </div>
      
      <div className="mb-8">
        <PortfolioSummary />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Portfolio Performance</h3>
            
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolioData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0070f3" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0070f3" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#9ca3af' }} 
                    tickLine={{ stroke: '#4b5563' }}
                    axisLine={{ stroke: '#4b5563' }}
                    tickMargin={10}
                    interval="preserveStartEnd"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis 
                    tick={{ fill: '#9ca3af' }} 
                    tickLine={{ stroke: '#4b5563' }}
                    axisLine={{ stroke: '#4b5563' }}
                    tickMargin={10}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                    width={80}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return date.toLocaleDateString();
                    }}
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }}
                    itemStyle={{ color: '#ffffff' }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#0070f3" 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Account Summary</h3>
            
            <div className="space-y-4">
              <div className="bg-gray-700 p-3 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Available Cash</div>
                <div className="text-lg font-bold">${user.balance.toLocaleString()}</div>
              </div>
              
              <div className="bg-gray-700 p-3 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Copy Trading</div>
                <div className="text-lg font-bold flex items-center">
                  <span className={`h-2 w-2 rounded-full ${user.auto_copy ? 'bg-success' : 'bg-gray-500'} mr-2`}></span>
                  {user.auto_copy ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              
              <div className="bg-gray-700 p-3 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Followed Traders</div>
                <div className="text-lg font-bold">{user.following.length}</div>
              </div>
              
              <div className="bg-gray-700 p-3 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Total Trades</div>
                <div className="text-lg font-bold">{user.trades.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Your Holdings</h2>
        
        {!hasPositions ? (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400 mb-4">You don't have any positions yet.</p>
            <p className="text-sm text-gray-500">When you follow traders and enable auto-copy, their trades will appear here.</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Shares</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Current Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Market Value</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">P&L</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {user.portfolio.map((position) => {
                  const cost = position.avg_price * position.shares;
                  const value = position.current_price * position.shares;
                  const pnl = value - cost;
                  const pnlPercent = (pnl / cost) * 100;
                  const isPositive = pnl >= 0;
                  
                  return (
                    <tr key={position.ticker} className="hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{position.ticker}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{position.shares}</td>
                      <td className="px-6 py-4 whitespace-nowrap">${position.avg_price.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">${position.current_price.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className={`font-medium flex items-center justify-end ${isPositive ? 'text-success' : 'text-danger'}`}>
                          {isPositive ? (
                            <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                          ) : (
                            <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
                          )}
                          ${Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          <span className="ml-1 text-xs">({Math.abs(pnlPercent).toFixed(2)}%)</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Recent Trades</h2>
        
        {user.trades.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400 mb-4">You haven't made any trades yet.</p>
            <p className="text-sm text-gray-500">When you follow traders and enable auto-copy, your trades will appear here.</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date/Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {user.trades.map((trade, index) => (
                  <tr key={`${trade.timestamp}-${index}`} className="hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                      {new Date(trade.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{trade.ticker}</td>
                    <td className={`px-6 py-4 whitespace-nowrap ${trade.action === 'BUY' ? 'text-success' : 'text-danger'}`}>
                      {trade.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{trade.size}</td>
                    <td className="px-6 py-4 whitespace-nowrap">${trade.price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      ${(trade.price * trade.size).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}