import { Trade } from '../types';
import * as path from 'path';
import { 
  initializeUserPortfolio, 
  followTrader, 
  updateCopySettings, 
  executeTrade 
} from '../services/portfolioManager';

const tradersPath = path.join(__dirname, '..', 'data', 'traders');
const { traders, stockTickers, generateStrategyBasedTrade } = require(tradersPath);

/**
 * Simulate a portfolio for a given time period
 */
async function simulatePortfolio(
  userId: number, 
  traderId: number, 
  days: number = 30, 
  tradesPerDay: number = 5
): Promise<void> {
  // Initialize portfolio
  const portfolio = initializeUserPortfolio(userId, 100000);
  
  // Follow trader
  followTrader(userId, traderId);
  
  // Set up copy trading
  updateCopySettings(userId, traderId, {
    enabled: true,
    position_size_type: 'percentage',
    position_size: 10, // 10% of portfolio per trade
    max_position_size: 10000,
    max_daily_loss: 5000,
    stop_loss_percentage: 5,
    take_profit_percentage: 10,
    max_drawdown: 20
  });
  
  // Get trader
  const trader = traders.find((t: any) => t.id === traderId);
  if (!trader) {
    console.error(`Trader with ID ${traderId} not found`);
    return;
  }
  
  console.log(`\n=== Simulating portfolio copying ${trader.name} for ${days} days ===\n`);
  console.log(`Starting balance: $${portfolio.balance.toFixed(2)}`);
  
  // Track metrics
  let totalTrades = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let largestWin = 0;
  let largestLoss = 0;
  let totalPnL = 0;
  
  // Mock start date (30 days ago)
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Simulate each day
  for (let day = 0; day < days; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + day);
    
    // Skip weekends
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue; // Skip Saturday and Sunday
    }
    
    // Generate trades for this day
    const dayTrades: Trade[] = [];
    const numTrades = Math.floor(Math.random() * tradesPerDay) + 1;
    
    for (let i = 0; i < numTrades; i++) {
      // Generate trade based on trader's strategy
      const rawTrade = generateStrategyBasedTrade(traderId);
      
      // Create trade object
      const trade: Trade = {
        id: Date.now() + i,
        trader_id: traderId,
        symbol: rawTrade.ticker,
        type: rawTrade.action.toLowerCase() as 'buy' | 'sell',
        quantity: rawTrade.size,
        price: rawTrade.price,
        profit_loss: 0, // Will be calculated by executeTrade
        timestamp: currentDate.toISOString()
      };
      
      dayTrades.push(trade);
      
      // Execute the trade
      await executeTrade(userId, trade);
      
      // Update metrics
      totalTrades++;
      if (trade.profit_loss > 0) {
        winningTrades++;
        largestWin = Math.max(largestWin, trade.profit_loss);
      } else if (trade.profit_loss < 0) {
        losingTrades++;
        largestLoss = Math.min(largestLoss, trade.profit_loss);
      }
      
      totalPnL += trade.profit_loss;
    }
  }
  
  // Print results
  console.log(`\n=== Simulation Results ===`);
  console.log(`Final balance: $${portfolio.balance.toFixed(2)}`);
  console.log(`Total P&L: $${totalPnL.toFixed(2)}`);
  console.log(`Win rate: ${(winningTrades / totalTrades * 100).toFixed(1)}%`);
  console.log(`Total trades: ${totalTrades}`);
  console.log(`Winning trades: ${winningTrades}`);
  console.log(`Losing trades: ${losingTrades}`);
  
  if (largestWin > 0) {
    console.log(`Largest win: $${largestWin.toFixed(2)}`);
  }
  
  if (largestLoss < 0) {
    console.log(`Largest loss: $${largestLoss.toFixed(2)}`);
  }
  
  console.log('\nCurrent holdings:');
  portfolio.holdings.forEach(holding => {
    console.log(`${holding.symbol}: ${holding.quantity} shares, avg price: $${holding.average_price.toFixed(2)}, current value: $${holding.current_value.toFixed(2)}, P&L: $${holding.unrealized_pnl.toFixed(2)}`);
  });
}

// Run the simulation
// Usage: ts-node simulatePortfolio.ts <userId> <traderId> <days> <tradesPerDay>
const args = process.argv.slice(2);
const userId = parseInt(args[0]) || 1;
const traderId = parseInt(args[1]) || 1;
const days = parseInt(args[2]) || 30;
const tradesPerDay = parseInt(args[3]) || 5;

simulatePortfolio(userId, traderId, days, tradesPerDay)
  .then(() => {
    console.log('\nSimulation completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error in simulation:', error);
    process.exit(1);
  });