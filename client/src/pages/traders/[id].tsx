import React from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import Image from 'next/image';
import { useTraders } from '@/contexts/TraderContext';
import { useUser } from '@/contexts/UserContext';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/solid';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Trade } from '@/types';

// Generate mock chart data
const generateChartData = (trader_id: number) => {
  const data = [];
  const baseValue = 1000;
  let currentValue = baseValue;
  
  // Generate daily data for the past 30 days
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Different volatility based on trader ID
    const volatility = trader_id === 1 ? 0.02 : 
                        trader_id === 2 ? 0.01 : 
                        trader_id === 3 ? 0.03 : 
                        trader_id === 4 ? 0.005 : 0.015;
    
    // Different trend based on trader ID
    const trend = trader_id === 1 ? 0.005 : 
                  trader_id === 2 ? 0.003 : 
                  trader_id === 3 ? 0.008 : 
                  trader_id === 4 ? 0.002 : 0.004;
    
    // Calculate daily change
    const change = currentValue * (trend + (Math.random() - 0.5) * volatility);
    currentValue += change;
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: currentValue,
    });
  }
  
  return data;
};

export default function TraderDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { getTraderById, isLoading } = useTraders();
  const { isFollowing, toggleFollowTrader } = useUser();
  
  const trader = getTraderById(Number(id));
  const following = trader ? isFollowing(trader.id) : false;
  
  if (isLoading) {
    return (
      <Layout title="Loading...">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-800 rounded mb-6"></div>
          <div className="h-48 bg-gray-800 rounded"></div>
        </div>
      </Layout>
    );
  }
  
  if (!trader) {
    return (
      <Layout title="Trader Not Found">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Trader Not Found</h1>
          <p className="text-gray-400 mb-6">The trader you're looking for doesn't exist or may have been removed.</p>
          <Link href="/traders" className="px-4 py-2 bg-primary text-white rounded-md">
            Back to Traders
          </Link>
        </div>
      </Layout>
    );
  }
  
  // Get chart data
  const chartData = generateChartData(trader.id);
  
  // Calculate return metrics
  const startValue = chartData[0].value;
  const endValue = chartData[chartData.length - 1].value;
  const totalReturn = endValue - startValue;
  const totalReturnPercentage = (totalReturn / startValue) * 100;
  const isPositiveReturn = totalReturn >= 0;
  
  return (
    <Layout title={`${trader.name} - Trader Profile`}>
      <div className="mb-4">
        <Link href="/traders" className="inline-flex items-center text-gray-400 hover:text-primary">
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Back to Traders
        </Link>
      </div>
      
      <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="relative h-16 w-16 rounded-full overflow-hidden mr-4">
                <Image 
                  src={trader.profilePic} 
                  alt={trader.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{trader.name}</h1>
                <div className="text-gray-400 flex items-center">
                  <span>{trader.followers.toLocaleString()} followers</span>
                  <span className="mx-2">•</span>
                  <span className={`${trader.risk_level === 'High' ? 'text-danger' : trader.risk_level === 'Medium' ? 'text-warning' : 'text-success'}`}>
                    {trader.risk_level} Risk
                  </span>
                </div>
                {trader.description && (
                  <p className="text-sm text-gray-300 mt-2 max-w-2xl">{trader.description}</p>
                )}
              </div>
            </div>
            
            <button
              onClick={() => toggleFollowTrader(trader.id)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                following
                  ? 'bg-primary text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {following ? 'Following' : 'Follow'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">30-Day Return</div>
              <div className={`text-2xl font-bold flex items-center ${isPositiveReturn ? 'text-success' : 'text-danger'}`}>
                {isPositiveReturn ? (
                  <ArrowTrendingUpIcon className="w-5 h-5 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="w-5 h-5 mr-1" />
                )}
                {trader.return_30d.toFixed(1)}%
              </div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Win Rate</div>
              <div className="text-2xl font-bold">{trader.win_rate}%</div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Sharpe Ratio</div>
              <div className="text-2xl font-bold">{trader.sharpe_ratio?.toFixed(2) || 'N/A'}</div>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="text-lg font-semibold mb-3">Performance Chart</div>
            <div className="bg-gray-700 p-4 rounded-lg h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
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
          
          <div>
            <div className="text-lg font-semibold mb-3">Recent Trades</div>
            
            {trader.trades.length === 0 ? (
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <p className="text-gray-400">No recent trades available.</p>
              </div>
            ) : (
              <div className="bg-gray-700 p-4 rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-600">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ticker</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Size</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Value</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date/Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-600">
                    {trader.trades.map((trade: Trade, index) => (
                      <tr key={`${trade.trader_id}-${trade.timestamp}-${index}`}>
                        <td className="px-4 py-3 whitespace-nowrap font-medium">{trade.ticker}</td>
                        <td className={`px-4 py-3 whitespace-nowrap ${trade.action === 'BUY' ? 'text-success' : 'text-danger'}`}>
                          {trade.action}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">${trade.price.toFixed(2)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{trade.size}</td>
                        <td className="px-4 py-3 whitespace-nowrap">${(trade.price * trade.size).toLocaleString()}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                          {new Date(trade.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}