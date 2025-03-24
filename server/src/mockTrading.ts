import { Server } from 'socket.io';
import { Trade as TradeType, Trader } from './types';
import { fetchStockData, getStockPrice } from './services/yahooFinance';
import * as path from 'path';

// Import trader data and functions - use path.join for cross-platform compatibility
const tradersPath = path.join(__dirname, 'data', 'traders');
const { traders, stockTickers, generateStrategyBasedTrade } = require(tradersPath);

// Cache stock prices to reduce API calls
const priceCache: {[symbol: string]: {price: number, timestamp: number}} = {};
const CACHE_EXPIRATION = 60000; // 1 minute

// Trade ID counter
let tradeId = 1;

// Get stock price with caching
async function getCachedStockPrice(symbol: string): Promise<number> {
  const now = Date.now();
  
  // Check if we have a valid cached price
  if (priceCache[symbol] && (now - priceCache[symbol].timestamp < CACHE_EXPIRATION)) {
    return priceCache[symbol].price;
  }
  
  // Fetch new price
  try {
    const price = await getStockPrice(symbol);
    
    // Update cache
    priceCache[symbol] = {
      price,
      timestamp: now
    };
    
    return price;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    
    // Use estimated price as fallback
    const fallbackPrice = stockTickers.find((st: any) => st.symbol === symbol)?.price || 100;
    return fallbackPrice + (Math.random() * 10 - 5);
  }
}

// Format trade for socket emission
async function formatTradeForSocket(trade: any): Promise<TradeType> {
  // Get real-time price if possible
  let price = trade.price;
  try {
    price = await getCachedStockPrice(trade.ticker);
  } catch (error) {
    console.log(`Using estimated price for ${trade.ticker}`);
  }
  
  // Get trader info
  const trader = traders.find((t: any) => t.id === trade.trader_id);
  
  // Calculate P&L (simplified)
  const isProfitable = Math.random() > 0.4; // Slight bias towards profitable trades
  const profitLossPercentage = (Math.random() * 5) * (isProfitable ? 1 : -1);
  const profitLoss = price * trade.size * (profitLossPercentage / 100);
  
  return {
    id: tradeId++,
    trader_id: trade.trader_id,
    trader_name: trader?.name || `Trader ${trade.trader_id}`,
    trader_avatar: trader?.profilePic || `/avatars/trader${trade.trader_id}.jpg`,
    symbol: trade.ticker,
    type: trade.action.toLowerCase() as 'buy' | 'sell',
    quantity: trade.size,
    price: price,
    profit_loss: profitLoss,
    timestamp: trade.timestamp || new Date().toISOString()
  };
}

// Generate a trade for a specific trader
async function generateTradeForTrader(traderId: number): Promise<TradeType> {
  // Get trader
  const trader = traders.find((t: any) => t.id === traderId);
  if (!trader) {
    throw new Error(`Trader with ID ${traderId} not found`);
  }
  
  // Select a stock from trader's preferred list
  const stockSymbol = trader.preferredStocks[Math.floor(Math.random() * trader.preferredStocks.length)];
  
  // Get real stock price if possible
  let stockPrice;
  try {
    stockPrice = await getCachedStockPrice(stockSymbol);
  } catch (error) {
    console.error(`Error getting price for ${stockSymbol}:`, error);
    // Fallback to estimated price
    stockPrice = null;
  }
  
  // Generate trade
  const trade = generateStrategyBasedTrade(traderId, stockPrice);
  
  // Format for socket emission
  return formatTradeForSocket(trade);
}

// Update market data for multiple stocks at once
async function emitMarketData(io: Server) {
  try {
    // Get symbols from all trader preferred stocks
    const allSymbols = new Set<string>();
    traders.forEach((trader: any) => {
      trader.preferredStocks.forEach((symbol: string) => {
        allSymbols.add(symbol);
      });
    });
    
    // Convert to array and fetch data in batches to respect API limits
    const symbols = Array.from(allSymbols);
    // Alpha Vantage free tier limits: process a few at a time
    const BATCH_SIZE = 5;
    
    for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
      const batchSymbols = symbols.slice(i, i + BATCH_SIZE);
      try {
        const quotes = await fetchStockData(batchSymbols);
        
        quotes.forEach(quote => {
          // Update cache
          priceCache[quote.symbol] = {
            price: quote.price,
            timestamp: Date.now()
          };
          
          // Emit market data
          const marketData = {
            symbol: quote.symbol,
            price: quote.price,
            change: quote.change,
            volume: quote.volume || 0,
            timestamp: new Date().toISOString()
          };
          
          io.emit('market_data', marketData);
        });
      } catch (error) {
        console.error(`Error fetching batch of stock data:`, error);
      }
      
      // Delay between batches to respect API rate limits
      if (i + BATCH_SIZE < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 12000)); // AlphaVantage has 5 calls/min limit
      }
    }
  } catch (error) {
    console.error('Error in emitMarketData:', error);
  }
}

// Schedule trades based on trader's frequency
function scheduleTraderTrades(io: Server) {
  traders.forEach((trader: any) => {
    // Convert trades per hour to milliseconds between trades
    const tradeInterval = Math.floor((1 / trader.tradeFrequency) * 60 * 60 * 1000);
    
    // Add some randomness (±20%)
    const randomizedInterval = tradeInterval * (0.8 + Math.random() * 0.4);
    
    // Schedule recurring trades
    setInterval(async () => {
      try {
        const trade = await generateTradeForTrader(trader.id);
        
        // Store trade in trader's history
        if (trader.trades) {
          trader.trades.unshift(trade);
          // Keep only last 20 trades
          if (trader.trades.length > 20) {
            trader.trades = trader.trades.slice(0, 20);
          }
        }
        
        // Emit trade event
        io.emit('trade', trade);
        
        // Occasionally update trader stats
        if (Math.random() > 0.7) {
          const traderUpdate = {
            id: trader.id,
            name: trader.name,
            avatar: trader.profilePic,
            daily_return: (Math.random() * 2 - 0.5), // -0.5% to 1.5%
            win_rate: trader.win_rate + (Math.random() * 2 - 1), // Small fluctuation
            recent_trades: trader.trades.slice(0, 5)
          };
          io.emit('trader_update', traderUpdate);
        }
        
        // Emit portfolio update for this trader
        const portfolioUpdate = {
          trader_id: trader.id,
          trader_name: trader.name,
          trader_avatar: trader.profilePic,
          total_pnl: trader.return_30d * 1000, // Simplified
          open_positions: Math.floor(Math.random() * 10) + 5,
          win_rate: trader.win_rate / 100,
          recent_trade: {
            symbol: trade.symbol,
            type: trade.type,
            profit_loss: trade.profit_loss,
            timestamp: trade.timestamp
          }
        };
        io.emit('portfolio_update', portfolioUpdate);
        
      } catch (error) {
        console.error(`Error generating trade for ${trader.name}:`, error);
      }
    }, randomizedInterval);
  });
}

export function startMockTrading(io: Server) {
  console.log('Starting mock trading engine...');
  
  // Initial market data update
  emitMarketData(io);
  
  // Schedule regular market data updates
  // Alpha Vantage free tier has a limit of 5 API calls per minute
  // We'll update every 2 minutes to respect rate limits
  setInterval(() => {
    emitMarketData(io);
  }, 120000); // 2 minutes
  
  // Schedule trades for each trader based on their frequency
  scheduleTraderTrades(io);
  
  console.log('Mock trading engine started.');
}