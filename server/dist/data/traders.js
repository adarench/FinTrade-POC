// Trader personas with different strategies
const traders = [
  {
    id: 1,
    name: "Buffett_Bot",
    profilePic: "/avatars/trader1.jpg",
    followers: 5218,
    return_30d: 8.7,
    win_rate: 78,
    risk_level: "Low",
    sharpe_ratio: 2.5,
    description: "Value investing bot that focuses on fundamentally strong companies with long-term potential",
    strategy: "Value",
    tradeFrequency: 0.3, // Trades less frequently (trades per hour)
    avgSize: 1000,
    preferredStocks: ["AAPL", "MSFT", "DIS", "KO", "JNJ", "PG"],
    trades: []
  },
  {
    id: 2,
    name: "CathieWoodAI",
    profilePic: "/avatars/trader2.jpg",
    followers: 4392,
    return_30d: 16.5,
    win_rate: 61,
    risk_level: "High",
    sharpe_ratio: 1.7,
    description: "Disruptive innovation focused bot that hunts for high-growth tech opportunities",
    strategy: "Growth",
    tradeFrequency: 1.5, // Trades moderately (trades per hour)
    avgSize: 2000,
    preferredStocks: ["TSLA", "NVDA", "COIN", "PLTR", "SQ", "ROKU"],
    trades: []
  },
  {
    id: 3,
    name: "RealPhilTown",
    profilePic: "/avatars/trader3.jpg",
    followers: 3187,
    return_30d: 11.2,
    win_rate: 72,
    risk_level: "Medium",
    sharpe_ratio: 2.1,
    description: "CANSLIM method practitioner looking for technically strong breakout stocks",
    strategy: "Momentum",
    tradeFrequency: 2.0, // Trades frequently (trades per hour)
    avgSize: 1500,
    preferredStocks: ["AMZN", "AAPL", "MSFT", "GOOGL", "META", "AMD"],
    trades: []
  },
  {
    id: 4,
    name: "MemeStockLegend",
    profilePic: "/avatars/trader4.jpg",
    followers: 8761,
    return_30d: 24.8,
    win_rate: 52,
    risk_level: "High",
    sharpe_ratio: 1.1,
    description: "Retail investor chasing popular meme stocks and social sentiment",
    strategy: "Meme",
    tradeFrequency: 3.0, // Trades very frequently (trades per hour)
    avgSize: 800,
    preferredStocks: ["GME", "AMC", "TSLA", "BBBY", "PLTR", "DOGE", "SHIB"],
    trades: []
  },
  {
    id: 5,
    name: "YourFriendMike",
    profilePic: "/avatars/trader5.jpg",
    followers: 1053,
    return_30d: 5.9,
    win_rate: 64,
    risk_level: "Medium",
    sharpe_ratio: 1.8,
    description: "Regular investor making sensible trades based on news and intuition",
    strategy: "Mixed",
    tradeFrequency: 0.8, // Trades occasionally (trades per hour)
    avgSize: 500,
    preferredStocks: ["AAPL", "TSLA", "DIS", "NFLX", "AMZN", "SBUX"],
    trades: []
  },
  {
    id: 6,
    name: "RedditInvestor42",
    profilePic: "/avatars/trader6.jpg",
    followers: 2471,
    return_30d: 14.2,
    win_rate: 59,
    risk_level: "High",
    sharpe_ratio: 1.4,
    description: "Following Reddit's WSB hot picks while keeping an eye on sentiment",
    strategy: "Social",
    tradeFrequency: 2.5, // Trades frequently (trades per hour)
    avgSize: 700,
    preferredStocks: ["TSLA", "NVDA", "AMD", "PLTR", "SOFI", "HOOD"],
    trades: []
  },
  {
    id: 7,
    name: "IndexETFQueen",
    profilePic: "/avatars/trader7.jpg",
    followers: 1824,
    return_30d: 4.2,
    win_rate: 81,
    risk_level: "Low",
    sharpe_ratio: 2.7,
    description: "ETF-focused investor with occasional sector rotation based on market conditions",
    strategy: "ETF",
    tradeFrequency: 0.5, // Trades rarely (trades per hour)
    avgSize: 2000,
    preferredStocks: ["SPY", "QQQ", "VTI", "ARKK", "XLK", "XLF"],
    trades: []
  }
];

// Real stock tickers and price ranges
const stockTickers = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "META", name: "Meta Platforms Inc." },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "AMD", name: "Advanced Micro Devices Inc." },
  { symbol: "DIS", name: "The Walt Disney Company" },
  { symbol: "NFLX", name: "Netflix Inc." },
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust" },
  { symbol: "QQQ", name: "Invesco QQQ Trust" },
  { symbol: "ARKK", name: "ARK Innovation ETF" },
  { symbol: "GME", name: "GameStop Corp." },
  { symbol: "AMC", name: "AMC Entertainment Holdings Inc." },
  { symbol: "PLTR", name: "Palantir Technologies Inc." },
  { symbol: "SOFI", name: "SoFi Technologies Inc." },
  { symbol: "HOOD", name: "Robinhood Markets Inc." },
  { symbol: "COIN", name: "Coinbase Global Inc." },
  { symbol: "SQ", name: "Block Inc." }
];

/**
 * Generate a trade based on trader strategy and preferences
 * @param {*} traderId 
 * @param {*} price 
 * @returns trade object
 */
function generateStrategyBasedTrade(traderId, price = null) {
  const trader = traders.find(t => t.id === traderId);
  if (!trader) {
    return generateRandomTrade();
  }
  
  // Select ticker based on trader preferences
  const ticker = trader.preferredStocks[Math.floor(Math.random() * trader.preferredStocks.length)];
  
  // Determine action based on strategy bias
  let actionBias = 0.5; // Default 50/50
  
  switch (trader.strategy) {
    case "Value":
      // Value investors tend to buy more than sell
      actionBias = 0.7;
      break;
    case "Growth":
      // Growth investors buy aggressively
      actionBias = 0.8;
      break;
    case "Momentum":
      // Momentum traders follow trends (simplified)
      actionBias = Math.random() > 0.5 ? 0.8 : 0.2; // Either strongly buy or sell
      break;
    case "Meme":
      // Meme traders are erratic
      actionBias = Math.random();
      break;
    case "Social":
      // Social investors follow sentiment (simplified)
      actionBias = Math.random() > 0.3 ? 0.65 : 0.35; // Slightly biased towards buying
      break;
    case "ETF":
      // ETF investors buy and hold
      actionBias = 0.9;
      break;
  }
  
  const action = Math.random() < actionBias ? 'BUY' : 'SELL';
  
  // Size based on trader avg size with some variation
  const sizeVariation = (Math.random() * 0.5 + 0.75); // 75-125% of average
  const tradeSize = Math.floor(trader.avgSize * sizeVariation);
  
  // Use provided price or estimate
  const tradePrice = price || getEstimatedPrice(ticker);
  
  return {
    trader_id: traderId,
    ticker,
    action,
    price: tradePrice,
    size: Math.floor(tradeSize / tradePrice),  // Convert dollar amount to shares
    timestamp: new Date().toISOString()
  };
}

// Helper function to generate a random stock price 
const getEstimatedPrice = (ticker) => {
  // Base price ranges for common stocks (simplified)
  const priceMap = {
    'AAPL': 180,
    'MSFT': 390,
    'GOOGL': 150,
    'AMZN': 170,
    'META': 480,
    'TSLA': 180,
    'NVDA': 900,
    'AMD': 160,
    'DIS': 110,
    'NFLX': 600,
    'SPY': 500,
    'QQQ': 440,
    'ARKK': 45,
    'GME': 20,
    'AMC': 5,
    'PLTR': 25,
    'SOFI': 8,
    'HOOD': 15,
    'COIN': 250,
    'SQ': 80
  };
  
  const basePrice = priceMap[ticker] || 100;
  const variation = (Math.random() * 10 - 5) / 100; // +/- 5%
  return parseFloat((basePrice * (1 + variation)).toFixed(2));
};

// Generate a completely random trade (fallback)
const generateRandomTrade = () => {
  const traderId = Math.floor(Math.random() * traders.length) + 1;
  const ticker = stockTickers[Math.floor(Math.random() * stockTickers.length)].symbol;
  const action = Math.random() > 0.5 ? 'BUY' : 'SELL';
  const price = getEstimatedPrice(ticker);
  const size = Math.floor(Math.random() * 100) + 1;
  
  return {
    trader_id: traderId,
    ticker,
    action,
    price,
    size,
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  traders,
  stockTickers,
  generateRandomTrade,
  generateStrategyBasedTrade
};