import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTraders } from '@/contexts/TraderContext';
import { useUser } from '@/contexts/UserContext';
import Layout from '@/components/Layout';
import { Trader } from '@/types';

const TradersPage: React.FC = () => {
  const router = useRouter();
  const { traders } = useTraders();
  const { user, updateUser } = useUser();
  const [sortBy, setSortBy] = useState<keyof Trader>('monthly_return');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof Trader) => {
    if (field === sortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedTraders = traders ? [...traders].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return (aValue - bValue) * multiplier;
    }
    return 0;
  }) : [];

  const handleFollow = (traderId: number) => {
    if (!user || !updateUser) return;

    // Ensure following is an array
    const following = user.following || [];
    const isFollowing = following.includes(traderId);
    const newFollowing = isFollowing
      ? following.filter(id => id !== traderId)
      : [...following, traderId];

    updateUser({
      ...user,
      following: newFollowing
    });
  };

  const renderSortArrow = (field: keyof Trader) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <Layout title="Traders">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Top Traders</h1>
            <p className="text-gray-400">Follow and copy successful traders</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    Trader {renderSortArrow('name')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase cursor-pointer"
                    onClick={() => handleSort('monthly_return')}
                  >
                    Monthly Return {renderSortArrow('monthly_return')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase cursor-pointer"
                    onClick={() => handleSort('risk_level')}
                  >
                    Risk Level {renderSortArrow('risk_level')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase cursor-pointer"
                    onClick={() => handleSort('followers')}
                  >
                    Followers {renderSortArrow('followers')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {sortedTraders.map((trader) => {
                  const isFollowing = user?.following?.includes(trader.id) || false;
                  const lastTrade = trader.trades && trader.trades.length > 0 ? trader.trades[0] : null;
                  
                  return (
                    <tr 
                      key={trader.id} 
                      className="hover:bg-gray-700 transition-colors duration-150 ease-in-out"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-white cursor-pointer" onClick={() => router.push(`/traders/${trader.id}`)}>
                              {trader.name}
                            </div>
                            {lastTrade && (
                              <div className="text-sm text-gray-400">
                                Last trade: {lastTrade.symbol} @ ${lastTrade.price ? lastTrade.price.toFixed(2) : '0.00'}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          (trader.monthly_return || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {(trader.monthly_return || 0) >= 0 ? '+' : ''}{(trader.monthly_return || 0).toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          (!trader.risk_level || trader.risk_level === 'Unknown') ? 'bg-gray-900 text-gray-200' :
                          trader.risk_level === 'Low' ? 'bg-green-900 text-green-200' :
                          trader.risk_level === 'Medium' ? 'bg-yellow-900 text-yellow-200' :
                          'bg-red-900 text-red-200'
                        }`}>
                          {trader.risk_level || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {(trader.followers || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleFollow(trader.id)}
                          className={`px-4 py-2 rounded-lg transition-colors duration-150 ${
                            isFollowing
                              ? 'bg-gray-600 text-white hover:bg-gray-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {isFollowing ? 'Unfollow' : 'Follow'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TradersPage;
