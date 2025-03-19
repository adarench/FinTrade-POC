import React, { useState } from 'react';
import { useTraders } from '@/contexts/TraderContext';
import { useUser } from '@/contexts/UserContext';
import { Trader } from '@/types';

type SortField = keyof Pick<Trader, 'monthly_return' | 'followers'>;
type SortDirection = 'asc' | 'desc';

const LeaderboardTable: React.FC = () => {
  const { traders, isLoading, followTrader, unfollowTrader } = useTraders();
  const { user } = useUser();
  const [sortField, setSortField] = useState<SortField>('monthly_return');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const isFollowing = (traderId: number) => {
    return user?.following.includes(traderId) || false;
  };

  const toggleFollowTrader = (traderId: number) => {
    if (!user) return;

    if (isFollowing(traderId)) {
      unfollowTrader(traderId);
    } else {
      followTrader(traderId);
    }
  };

  const sortedTraders = [...(traders || [])].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    return sortDirection === 'asc' ? 
      (aValue as number) - (bValue as number) : 
      (bValue as number) - (aValue as number);
  });

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const calculateWinRate = (trader: Trader) => {
    if (!trader.trades.length) return 0;
    const winningTrades = trader.trades.filter(t => t.profit_loss > 0).length;
    return (winningTrades / trader.trades.length) * 100;
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="text-left text-gray-400 border-b border-gray-700">
            <th className="py-3 px-4">Rank</th>
            <th className="py-3 px-4">Trader</th>
            <th
              className="py-3 px-4 cursor-pointer"
              onClick={() => handleSort('monthly_return')}
            >
              Monthly Return
              {sortField === 'monthly_return' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th className="py-3 px-4">Win Rate</th>
            <th
              className="py-3 px-4 cursor-pointer"
              onClick={() => handleSort('followers')}
            >
              Followers
              {sortField === 'followers' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th className="py-3 px-4">Risk Level</th>
            <th className="py-3 px-4">Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedTraders.map((trader, index) => (
            <tr key={trader.id} className="border-b border-gray-700 hover:bg-gray-800">
              <td className="py-4 px-4">{index + 1}</td>
              <td className="py-4 px-4">
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{trader.name}</span>
                </div>
              </td>
              <td className={`py-4 px-4 ${trader.monthly_return >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {trader.monthly_return >= 0 ? '+' : ''}{trader.monthly_return.toFixed(2)}%
              </td>
              <td className="py-4 px-4">{calculateWinRate(trader).toFixed(1)}%</td>
              <td className="py-4 px-4">{trader.followers.toLocaleString()}</td>
              <td className="py-4 px-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  trader.risk_level === 'Low' ? 'bg-green-900 text-green-200' :
                  trader.risk_level === 'Medium' ? 'bg-yellow-900 text-yellow-200' :
                  'bg-red-900 text-red-200'
                }`}>
                  {trader.risk_level}
                </span>
              </td>
              <td className="py-4 px-4">
                <button
                  onClick={() => toggleFollowTrader(trader.id)}
                  className={`px-4 py-2 rounded-lg transition-colors duration-150 ${
                    isFollowing(trader.id)
                      ? 'bg-gray-600 hover:bg-gray-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  {isFollowing(trader.id) ? 'Unfollow' : 'Follow'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardTable;