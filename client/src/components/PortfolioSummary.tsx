import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/solid';

const PortfolioSummary: React.FC = () => {
  const { user } = useUser();
  
  if (!user) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-700 rounded w-1/2 mb-6"></div>
        <div className="flex space-x-4">
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  // Calculate portfolio value
  const portfolioValue = user.portfolio.reduce((total, holding) => {
    return total + (holding.shares * holding.current_price);
  }, 0);

  // Calculate portfolio performance
  const portfolioCost = user.portfolio.reduce((total, holding) => {
    return total + (holding.shares * holding.avg_price);
  }, 0);
  
  const totalReturn = portfolioValue - portfolioCost;
  const totalReturnPercentage = portfolioCost > 0 
    ? ((totalReturn / portfolioCost) * 100) 
    : 0;
  
  const isPositiveReturn = totalReturn >= 0;
  const returnColor = isPositiveReturn ? 'text-success' : 'text-danger';
  const ReturnIcon = isPositiveReturn ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-2">Portfolio Summary</h3>
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-3xl font-bold">${portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          <div className={`flex items-center ${returnColor} text-sm mt-1`}>
            <ReturnIcon className="w-4 h-4 mr-1" />
            <span>${Math.abs(totalReturn).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            <span className="ml-1">({Math.abs(totalReturnPercentage).toFixed(2)}%)</span>
          </div>
        </div>
        
        <div className="bg-gray-700 px-4 py-2 rounded-lg">
          <div className="text-sm text-gray-400">Cash Balance</div>
          <div className="text-xl font-semibold">${user.balance.toLocaleString()}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-700 p-3 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Positions</div>
          <div className="text-lg font-semibold">{user.portfolio.length}</div>
        </div>
        
        <div className="bg-gray-700 p-3 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Following</div>
          <div className="text-lg font-semibold">{user.following.length} Traders</div>
        </div>
        
        <div className="bg-gray-700 p-3 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Auto-Copy</div>
          <div className="text-lg font-semibold">{user.auto_copy ? 'Enabled' : 'Disabled'}</div>
        </div>
        
        <div className="bg-gray-700 p-3 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Copy Amount</div>
          <div className="text-lg font-semibold">${user.copy_amount}</div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSummary;