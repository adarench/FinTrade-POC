import React, { useState } from 'react';
import { useTraders } from '@/contexts/TraderContext';
import { useUser } from '@/contexts/UserContext';
import { Trader } from '@/types';
import Layout from '@/components/Layout';
import { FaUser, FaChartLine, FaUserPlus, FaUserMinus, FaStar, FaCommentDots } from 'react-icons/fa';

const TraderCard: React.FC<{
  trader: Trader;
  isFollowing: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
}> = ({ trader, isFollowing, onFollow, onUnfollow }) => {
  const [showComments, setShowComments] = useState(false);

  // Calculate performance rating (1-5 stars)
  const return30d = trader.monthly_return || 0;
  const rating = Math.min(5, Math.max(1, Math.floor(return30d / 5)));

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-4 shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <img
            src={trader.avatar || '/default-avatar.png'}
            alt={trader.name || 'Trader'}
            className="w-16 h-16 rounded-full mr-4"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/default-avatar.png';
            }}
          />
          <div>
            <h3 className="text-xl font-bold text-white">{trader.name}</h3>
            <div className="flex items-center mt-1">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={i < rating ? 'text-yellow-400' : 'text-gray-600'}
                />
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={isFollowing ? onUnfollow : onFollow}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            isFollowing
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isFollowing ? (
            <>
              <FaUserMinus className="mr-2" /> Unfollow
            </>
          ) : (
            <>
              <FaUserPlus className="mr-2" /> Follow
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-gray-700 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">30-Day Return</p>
          <p className={`text-lg font-bold ${(trader.monthly_return || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {(trader.monthly_return || 0).toFixed(1)}%
          </p>
        </div>
        <div className="bg-gray-700 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">Win Rate</p>
          <p className="text-lg font-bold text-white">{(trader.win_rate || 0).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-700 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">Followers</p>
          <p className="text-lg font-bold text-white">{(trader.followers || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-gray-300">{trader.description || `${trader.name} is a ${trader.risk_level.toLowerCase()} risk trader.`}</p>
          <button
            onClick={() => setShowComments(!showComments)}
            className="ml-4 text-blue-400 hover:text-blue-300"
          >
            <FaCommentDots size={20} />
          </button>
        </div>
        
        {showComments && (
          <div className="mt-4 bg-gray-700 p-4 rounded-lg">
            <h4 className="text-white font-bold mb-2">Recent Comments</h4>
            <div className="space-y-2">
              {/* Placeholder for comments - will be implemented in next phase */}
              <p className="text-gray-400 text-sm">Comments feature coming soon!</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <h4 className="text-white font-bold mb-2">Recent Trades</h4>
        <div className="space-y-2">
          {(trader.trades || []).slice(0, 3).map((trade) => (
            <div
              key={trade.id}
              className={`flex items-center justify-between p-2 rounded ${
                trade.profit_loss >= 0 ? 'bg-green-900/30' : 'bg-red-900/30'
              }`}
            >
              <div className="flex items-center">
                <span className="text-gray-300">{trade.symbol}</span>
                <span className={`ml-2 ${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                  {trade.type.toUpperCase()}
                </span>
              </div>
              <span className={trade.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}>
                ${Math.abs(trade.profit_loss).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TradersPage: React.FC = () => {
  const { traders, isLoading, error, followTrader, unfollowTrader } = useTraders();
  const { user } = useUser();
  const [sortBy, setSortBy] = useState<'return' | 'followers' | 'winRate'>('return');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  // Sort and filter traders
  const sortedTraders = [...traders].sort((a, b) => {
    switch (sortBy) {
      case 'return':
        return (b.monthly_return || 0) - (a.monthly_return || 0);
      case 'followers':
        return b.followers - a.followers;
      case 'winRate':
        return b.win_rate - a.win_rate;
      default:
        return 0;
    }
  });

  const filteredTraders = riskFilter === 'all'
    ? sortedTraders
    : sortedTraders.filter(t => t.risk_level.toLowerCase() === riskFilter.toLowerCase());

  if (isLoading) {
    return (
      <Layout title="Traders">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Traders - Error">
        <div className="text-center text-red-500 mt-8">
          Error loading traders: {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Top Traders">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Top Traders</h1>
          <div className="flex space-x-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'return' | 'followers' | 'winRate')}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              <option value="return">Sort by Return</option>
              <option value="followers">Sort by Followers</option>
              <option value="winRate">Sort by Win Rate</option>
            </select>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {filteredTraders.map((trader) => (
            <TraderCard
              key={trader.id}
              trader={trader}
              isFollowing={user?.following?.includes(trader.id) || false}
              onFollow={() => followTrader(trader.id)}
              onUnfollow={() => unfollowTrader(trader.id)}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default TradersPage;
