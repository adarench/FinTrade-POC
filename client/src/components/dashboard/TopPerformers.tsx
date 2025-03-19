import React from 'react';
import { Trader } from '@/types';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';

interface TopPerformersProps {
  bestDaily: Trader;
  steadiest: Trader;
  mostCopied: Trader;
  onFollow: (traderId: number) => void;
}

const TopPerformers: React.FC<TopPerformersProps> = ({
  bestDaily,
  steadiest,
  mostCopied,
  onFollow,
}) => {
  const { user } = useUser();
  
  const isAlreadyFollowing = (trader: Trader) => {
    if (!user) return false;
    return user.following.includes(trader.id);
  };

  const TopTraderCard = ({ 
    trader, 
    title, 
    metric, 
    icon 
  }: { 
    trader: Trader; 
    title: string; 
    metric: string;
    icon: string;
  }) => {
    // Check if trader is valid
    if (!trader || typeof trader !== 'object') {
      return (
        <div className="bg-gray-700 rounded-lg p-4 animate-pulse">
          <div className="h-20 bg-gray-600 rounded"></div>
        </div>
      );
    }

    const following = isAlreadyFollowing(trader);
    
    // Safe access to trader properties
    const id = trader.id || 0;
    const name = trader.name || 'Unknown Trader';
    const avatar = trader.avatar || '/default-avatar.png';
    const win_rate = trader.win_rate || 0;
    const risk_level = trader.risk_level || 'Unknown';
    
    return (
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2 text-gray-400">
          <span className="text-xl">{icon}</span>
          <h3 className="text-sm">{title}</h3>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <Link href={`/traders/${id}`} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden">
              <img
                src={avatar}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="font-medium text-white">{name}</p>
              <p className={`text-lg font-semibold ${
                parseFloat(metric) >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {metric}
              </p>
            </div>
          </Link>
          
          <button
            onClick={() => onFollow(id)}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              following 
                ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {following ? 'Following' : 'Follow'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div>
            <p className="text-xs text-gray-400">Win Rate</p>
            <p className="text-sm font-medium text-blue-400">{win_rate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Risk Level</p>
            <p className="text-sm font-medium text-gray-300">{risk_level}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Top Performers</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TopTraderCard
          trader={bestDaily}
          title="Best Today"
          metric={`+${bestDaily ? (bestDaily.daily_return || 0).toFixed(2) : '0.00'}%`}
          icon="🚀"
        />
        <TopTraderCard
          trader={steadiest}
          title="Most Consistent"
          metric={`${steadiest ? (steadiest.win_rate || 0).toFixed(1) : '0.0'}% Win Rate`}
          icon="🎯"
        />
        <TopTraderCard
          trader={mostCopied}
          title="Most Followed"
          metric={mostCopied && mostCopied.followers ? 
            `${mostCopied.followers.toLocaleString()} Followers` : 
            `0 Followers`}
          icon="👥"
        />
      </div>
    </div>
  );
};

export default TopPerformers;