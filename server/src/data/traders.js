// Mock trader data
const traders = [
  {
    id: 1,
    name: "HFT God",
    profilePic: "https://randomuser.me/api/portraits/men/32.jpg",
    followers: 2563,
    return_30d: 14.2,
    win_rate: 67,
    risk_level: "High",
    sharpe_ratio: 1.8,
    description: "High-frequency momentum trader specializing in tech stocks",
    trades: []
  },
  {
    id: 2,
    name: "Swing Queen",
    profilePic: "https://randomuser.me/api/portraits/women/44.jpg",
    followers: 1872,
    return_30d: 8.7,
    win_rate: 72,
    risk_level: "Medium",
    sharpe_ratio: 2.1,
    description: "Swing trader with focus on biotech and healthcare",
    trades: []
  },
  {
    id: 3,
    name: "Crypto Whale",
    profilePic: "https://randomuser.me/api/portraits/men/21.jpg",
    followers: 4215,
    return_30d: 22.5,
    win_rate: 59,
    risk_level: "High",
    sharpe_ratio: 1.5,
    description: "Aggressive crypto trader with high risk tolerance",
    trades: []
  },
  {
    id: 4,
    name: "Value Investor",
    profilePic: "https://randomuser.me/api/portraits/women/28.jpg",
    followers: 1053,
    return_30d: 5.3,
    win_rate: 83,
    risk_level: "Low",
    sharpe_ratio: 2.7,
    description: "Long-term value investor focusing on blue chip stocks",
    trades: []
  },
  {
    id: 5,
    name: "Options Master",
    profilePic: "https://randomuser.me/api/portraits/men/15.jpg",
    followers: 3127,
    return_30d: 17.8,
    win_rate: 63,
    risk_level: "High",
    sharpe_ratio: 1.9,
    description: "Options trading specialist with focus on tech and finance",
    trades: []
  }
];

// Mock stock tickers and price ranges for fake trades
const stockTickers = [
  { symbol: "AAPL", price: 180, range: 10 },
  { symbol: "NVDA", price: 900, range: 50 },
  { symbol: "TSLA", price: 820, range: 40 },
  { symbol: "MSFT", price: 390, range: 15 },
  { symbol: "GOOGL", price: 150, range: 8 },
  { symbol: "AMZN", price: 170, range: 10 },
  { symbol: "META", price: 480, range: 20 },
  { symbol: "AMD", price: 160, range: 12 }
];

// Helper function to generate a random stock price within range
const getRandomPrice = (ticker) => {
  const stock = stockTickers.find(s => s.symbol === ticker);
  if (!stock) return 100; // Fallback
  
  const range = stock.range;
  const randomOffset = Math.random() * range * 2 - range; // Random offset within range
  return parseFloat((stock.price + randomOffset).toFixed(2));
};

// Generate a random trade
const generateRandomTrade = () => {
  const traderId = Math.floor(Math.random() * traders.length) + 1;
  const ticker = stockTickers[Math.floor(Math.random() * stockTickers.length)].symbol;
  const action = Math.random() > 0.5 ? 'BUY' : 'SELL';
  const price = getRandomPrice(ticker);
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
  generateRandomTrade
};