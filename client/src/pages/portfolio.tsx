import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useTraders } from '@/contexts/TraderContext';
import Layout from '@/components/Layout';
import CopyTradeSettings from '@/components/CopyTradeSettings';
import { Trade, CopySettings } from '@/types';
import Link from 'next/link';

const defaultCopySettings: CopySettings = {
  enabled: false,
  position_size_type: 'fixed',
  position_size: 100,
  max_position_size: 1000,
  stop_loss_percentage: 2,
  take_profit_percentage: 5,
  max_daily_loss: 500,
  max_drawdown: 10,
};

interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercentage: number;
}

const PortfolioPage: React.FC = () => {
  const { user, updateUser } = useUser();
  const { traders } = useTraders();
  const [selectedTraderId, setSelectedTraderId] = useState<number | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);

  // Generate portfolio positions based on user trades
  useEffect(() => {
    if (!user || !user.trades) return;
    
    // Group trades by symbol to calculate positions
    const positionMap = new Map<string, Position>();
    
    user.trades.forEach(trade => {
      const symbol = trade.symbol;
      const currentPrice = trade.price * (1 + (Math.random() * 0.1 - 0.05)); // Simulate a current price
      
      if (!positionMap.has(symbol)) {
        // Create new position
        positionMap.set(symbol, {
          symbol,
          quantity: trade.type === 'buy' ? trade.quantity : -trade.quantity,
          avgPrice: trade.price,
          currentPrice,
          value: 0, // Will calculate after
          pnl: 0, // Will calculate after
          pnlPercentage: 0 // Will calculate after
        });
      } else {
        // Update existing position
        const position = positionMap.get(symbol)!;
        const tradeQty = trade.type === 'buy' ? trade.quantity : -trade.quantity;
        
        // Update average price only on buys that increase position
        if ((position.quantity >= 0 && tradeQty > 0) || (position.quantity <= 0 && tradeQty < 0)) {
          const totalQty = Math.abs(position.quantity) + Math.abs(tradeQty);
          position.avgPrice = ((position.avgPrice * Math.abs(position.quantity)) + 
                              (trade.price * Math.abs(tradeQty))) / totalQty;
        }
        
        position.quantity += tradeQty;
        position.currentPrice = currentPrice;
      }
    });
    
    // Calculate value and P&L for each position
    const positionsArray = Array.from(positionMap.values())
      .filter(position => position.quantity !== 0) // Only show non-zero positions
      .map(position => {
        position.value = position.quantity * position.currentPrice;
        position.pnl = position.quantity * (position.currentPrice - position.avgPrice);
        position.pnlPercentage = ((position.currentPrice - position.avgPrice) / position.avgPrice) * 100;
        return position;
      })
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value)); // Sort by absolute value
    
    setPositions(positionsArray);
    
    // Set recent trades (last 10 trades, sorted by timestamp)
    const sortedTrades = [...user.trades]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
    
    setRecentTrades(sortedTrades);
  }, [user]);

  const handleSettingsUpdate = (traderId: number, field: keyof CopySettings, value: any) => {
    if (!user || !updateUser) return;

    const newSettings = {
      ...user.copy_settings[traderId] || defaultCopySettings,
      [field]: value,
    };

    updateUser({
      ...user,
      copy_settings: {
        ...user.copy_settings,
        [traderId]: newSettings,
      },
    });
  };

  const handleEnableChange = (traderId: number, enabled: boolean) => {
    if (!user || !updateUser) return;

    const newSettings = {
      ...user.copy_settings[traderId] || defaultCopySettings,
      enabled,
    };

    updateUser({
      ...user,
      copy_settings: {
        ...user.copy_settings,
        [traderId]: newSettings,
      },
    });
  };

  const handleCopyOnce = (traderId: number) => {
    console.log('Copy once clicked for trader:', traderId);
    // Implement copy once logic
  };

  if (!user) {
    return (
      <Layout title="Portfolio">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-400">Please log in to view your portfolio</p>
        </div>
      </Layout>
    );
  }

  // Calculate portfolio metrics
  const calculateMetrics = () => {
    const trades = user.trades;
    const totalTrades = trades.length;
    if (totalTrades === 0) {
      return {
        totalPnL: 0,
        winRate: 0,
        avgProfitPerTrade: 0,
        openPositions: 0,
      };
    }

    const winningTrades = trades.filter(t => t.profit_loss > 0).length;
    const totalPnL = trades.reduce((sum, t) => sum + t.profit_loss, 0);
    const avgProfitPerTrade = totalPnL / totalTrades;
    const winRate = (winningTrades / totalTrades) * 100;

    // Count open positions (most recent trade for each symbol)
    const positions = new Map<string, Trade>();
    trades.forEach(trade => {
      if (!positions.has(trade.symbol)) {
        positions.set(trade.symbol, trade);
      }
    });

    return {
      totalPnL,
      winRate,
      avgProfitPerTrade,
      openPositions: positions.size,
    };
  };

  const metrics = calculateMetrics();

  // Get active copy trading relationships
  const activeCopyTrading = Object.entries(user.copy_settings || {})
    .filter(([_, settings]) => settings.enabled)
    .map(([traderId]) => {
      const trader = traders?.find(t => t.id === Number(traderId));
      return trader ? {
        trader,
        settings: user.copy_settings[Number(traderId)]
      } : null;
    })
    .filter(Boolean);

  return (
    <Layout title="Portfolio">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Portfolio Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Stats */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Portfolio Overview</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Total Balance</p>
                  <p className="text-2xl font-bold text-white">${user.balance.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Open Positions</p>
                  <p className="text-2xl font-bold text-white">
                    {positions.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Open Positions */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Open Positions</h2>
              {positions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Symbol</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Price</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Current Price</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Value</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">P&L</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {positions.map((position, index) => (
                        <tr key={position.symbol} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{position.symbol}</td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${position.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {position.quantity.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-300">
                            ${position.avgPrice.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-300">
                            ${position.currentPrice.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-300">
                            ${Math.abs(position.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {position.pnl >= 0 ? '+' : ''}{position.pnl.toFixed(2)} 
                            <span className="text-xs ml-1">({position.pnlPercentage >= 0 ? '+' : ''}{position.pnlPercentage.toFixed(2)}%)</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                            <div className="flex justify-end space-x-2">
                              <button className="px-2 py-1 bg-green-600 rounded text-xs font-medium text-white hover:bg-green-500 transition-colors">
                                Buy
                              </button>
                              <button className="px-2 py-1 bg-red-600 rounded text-xs font-medium text-white hover:bg-red-500 transition-colors">
                                Sell
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  No open positions. Start trading to build your portfolio.
                </div>
              )}
            </div>

            {/* Trade History */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Trade History</h2>
              {recentTrades.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Symbol</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Value</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">P&L</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Trader</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {recentTrades.map((trade, index) => (
                        <tr key={trade.id} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                            {new Date(trade.timestamp).toLocaleDateString()} {new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{trade.symbol}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              trade.type === 'buy' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                            }`}>
                              {trade.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-300">
                            {trade.quantity.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-300">
                            ${trade.price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-300">
                            ${(trade.quantity * trade.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${trade.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.profit_loss >= 0 ? '+' : ''}{trade.profit_loss.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                            {trade.trader_id !== user.id ? (
                              <Link href={`/traders/${trade.trader_id}`} className="text-blue-400 hover:underline">
                                {trade.trader_name || `Trader #${trade.trader_id}`}
                              </Link>
                            ) : "You"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  No trade history available.
                </div>
              )}
            </div>

            {/* Portfolio Metrics */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Portfolio Metrics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Total P&L</p>
                  <p className={`text-2xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${metrics.totalPnL.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Win Rate</p>
                  <p className="text-2xl font-bold text-white">
                    {metrics.winRate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Avg. Profit/Trade</p>
                  <p className={`text-2xl font-bold ${metrics.avgProfitPerTrade >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${metrics.avgProfitPerTrade.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Open Positions</p>
                  <p className="text-2xl font-bold text-white">
                    {metrics.openPositions}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Copy Settings */}
          <div>
            {selectedTraderId && user.copy_settings[selectedTraderId] ? (
              <CopyTradeSettings
                settings={user.copy_settings[selectedTraderId]}
                onUpdate={(field, value) => handleSettingsUpdate(selectedTraderId, field, value)}
                onEnableChange={(enabled) => handleEnableChange(selectedTraderId, enabled)}
                onCopyOnce={() => handleCopyOnce(selectedTraderId)}
              />
            ) : (
              <div className="bg-gray-800 rounded-xl p-6">
                <p className="text-gray-400 text-center">
                  Select a trader to view copy settings
                </p>
              </div>
            )}
          </div>

          {/* Active Copy Trading */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Active Copy Trading</h2>
            {activeCopyTrading.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeCopyTrading.map(item => item && (
                  <div key={item.trader.id} className="bg-gray-800 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-white">{item.trader.name}</h3>
                        <p className="text-sm text-gray-400">
                          {item.settings.position_size_type === 'fixed' 
                            ? `Fixed Size: $${item.settings.position_size}`
                            : `Portfolio %: ${item.settings.position_size}%`}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Stop Loss</p>
                        <p className="text-white">{item.settings.stop_loss_percentage}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Take Profit</p>
                        <p className="text-white">{item.settings.take_profit_percentage}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Max Drawdown</p>
                        <p className="text-white">{item.settings.max_drawdown}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Max Position</p>
                        <p className="text-white">${item.settings.max_position_size}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
                No active copy trading relationships. Visit the Traders page to start copying successful traders.
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PortfolioPage;