import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trader } from '@/types';
import { useUser } from '@/contexts/UserContext';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/solid';

interface TraderCardProps {
  trader: Trader;
}

const TraderCard: React.FC<TraderCardProps> = ({ trader }) => {
  const { user, updateUser } = useUser();

  const isFollowing = user?.following.includes(trader.id) || false;

  const handleFollowToggle = () => {
    if (!user || !updateUser) return;

    const newFollowing = isFollowing
      ? user.following.filter(id => id !== trader.id)
      : [...user.following, trader.id];

    updateUser({
      ...user,
      following: newFollowing,
    });
  };

  // Determine color for return percentage
  const returnColor = trader.return_30d >= 0 ? 'text-success' : 'text-danger';
  
  // Determine risk level color
  let riskColor;
  switch (trader.risk_level) {
    case 'Low':
      riskColor = 'text-success bg-success/10';
      break;
    case 'Medium':
      riskColor = 'text-warning bg-warning/10';
      break;
    case 'High':
      riskColor = 'text-danger bg-danger/10';
      break;
  }

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-primary/10 hover:shadow-xl">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative h-12 w-12 rounded-full overflow-hidden">
              <Image 
                src={trader.profilePic} 
                alt={trader.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <Link href={`/traders/${trader.id}`} className="text-lg font-semibold hover:text-primary">
                {trader.name}
              </Link>
              <div className="text-xs text-gray-400">
                {trader.followers.toLocaleString()} followers
              </div>
            </div>
          </div>
          <button
            onClick={handleFollowToggle}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              isFollowing
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">30-Day Return</div>
            <div className={`text-lg font-bold flex items-center ${returnColor}`}>
              {trader.return_30d >= 0 ? (
                <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
              )}
              {trader.return_30d.toFixed(1)}%
            </div>
          </div>
          
          <div>
            <div className="text-xs text-gray-400 mb-1">Win Rate</div>
            <div className="text-lg font-bold">{trader.win_rate}%</div>
          </div>
          
          <div>
            <div className="text-xs text-gray-400 mb-1">Risk Level</div>
            <div className={`text-sm px-2 py-1 rounded-full ${riskColor}`}>
              {trader.risk_level}
            </div>
          </div>
        </div>
        
        {trader.description && (
          <div className="text-sm text-gray-300 mb-3">
            {trader.description}
          </div>
        )}
        
        <div className="mt-4">
          <Link 
            href={`/traders/${trader.id}`}
            className="text-primary text-sm hover:underline"
          >
            View Profile & Trades →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TraderCard;