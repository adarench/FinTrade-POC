import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTraders } from '@/contexts/TraderContext';
import { useUser } from '@/contexts/UserContext';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';

type SortField = 'return_30d' | 'win_rate' | 'followers' | 'sharpe_ratio';
type SortDirection = 'asc' | 'desc';

const LeaderboardTable: React.FC = () => {
  const { traders, isLoading } = useTraders();
  const { isFollowing, toggleFollowTrader } = useUser();
  const [sortField, setSortField] = useState<SortField>('return_30d');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedTraders = useMemo(() => {
    if (!traders) return [];
    
    return [...traders].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortDirection === 'asc') {
        return (aValue as number) - (bValue as number);
      } else {
        return (bValue as number) - (aValue as number);
      }
    });
  }, [traders, sortField, sortDirection]);

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg animate-pulse">
        <div className="h-10 bg-gray-700"></div>
        <div className="h-12 bg-gray-700 mt-1"></div>
        <div className="h-12 bg-gray-700 mt-1"></div>
        <div className="h-12 bg-gray-700 mt-1"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Trader
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('return_30d')}
            >
              <div className="flex items-center">
                30d Return
                {sortField === 'return_30d' && (
                  sortDirection === 'desc' ? 
                    <ChevronDownIcon className="w-4 h-4 ml-1" /> : 
                    <ChevronUpIcon className="w-4 h-4 ml-1" />
                )}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('win_rate')}
            >
              <div className="flex items-center">
                Win Rate
                {sortField === 'win_rate' && (
                  sortDirection === 'desc' ? 
                    <ChevronDownIcon className="w-4 h-4 ml-1" /> : 
                    <ChevronUpIcon className="w-4 h-4 ml-1" />
                )}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('sharpe_ratio')}
            >
              <div className="flex items-center">
                Sharpe Ratio
                {sortField === 'sharpe_ratio' && (
                  sortDirection === 'desc' ? 
                    <ChevronDownIcon className="w-4 h-4 ml-1" /> : 
                    <ChevronUpIcon className="w-4 h-4 ml-1" />
                )}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('followers')}
            >
              <div className="flex items-center">
                Followers
                {sortField === 'followers' && (
                  sortDirection === 'desc' ? 
                    <ChevronDownIcon className="w-4 h-4 ml-1" /> : 
                    <ChevronUpIcon className="w-4 h-4 ml-1" />
                )}
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Risk
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-gray-800 divide-y divide-gray-700">
          {sortedTraders.map((trader) => {
            const following = isFollowing(trader.id);
            
            // Determine color for return percentage
            const returnColor = trader.return_30d >= 0 ? 'text-success' : 'text-danger';
            
            // Determine risk level color
            let riskColor;
            switch (trader.risk_level) {
              case 'Low':
                riskColor = 'text-success';
                break;
              case 'Medium':
                riskColor = 'text-warning';
                break;
              case 'High':
                riskColor = 'text-danger';
                break;
            }
            
            return (
              <tr key={trader.id} className="hover:bg-gray-750">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 relative rounded-full overflow-hidden">
                      <Image
                        src={trader.profilePic}
                        alt={trader.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="ml-4">
                      <Link href={`/traders/${trader.id}`} className="font-medium hover:text-primary">
                        {trader.name}
                      </Link>
                      <div className="text-xs text-gray-400">
                        {trader.description?.substring(0, 40)}...
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`${returnColor} font-medium`}>
                    {trader.return_30d >= 0 ? '+' : ''}{trader.return_30d.toFixed(1)}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium">{trader.win_rate}%</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium">{trader.sharpe_ratio?.toFixed(1) || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium">{trader.followers.toLocaleString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm ${riskColor}`}>{trader.risk_level}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => toggleFollowTrader(trader.id)}
                    className={`text-xs px-3 py-1 rounded-full transition-colors ${
                      following
                        ? 'bg-primary text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {following ? 'Following' : 'Follow'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardTable;