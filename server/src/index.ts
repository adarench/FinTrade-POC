import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import * as path from 'path';
import { startMockTrading } from './mockTrading';
import { 
  initializeUserPortfolio, 
  getUserPortfolio, 
  followTrader, 
  unfollowTrader, 
  updateCopySettings, 
  processTrade, 
  updatePortfolioPrices 
} from './services/portfolioManager';

// Import trader data
const tradersPath = path.join(__dirname, 'data', 'traders');
const { traders } = require(tradersPath);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins in development
    methods: ["GET", "POST"]
  }
});

// Enable CORS for all routes
app.use(cors({
  origin: "*" // Allow all origins in development
}));

// REST API routes
app.get('/api/traders', (req, res) => {
  res.json(traders);
});

app.get('/api/trader/:id', (req, res) => {
  const traderId = parseInt(req.params.id);
  const trader = traders.find((t: any) => t.id === traderId);
  
  if (!trader) {
    return res.status(404).json({ error: 'Trader not found' });
  }
  
  res.json(trader);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Create a demo user portfolio for this connection
  const userId = Date.now();
  const userPortfolio = initializeUserPortfolio(userId);
  
  // Send initial data
  socket.emit('portfolio_init', userPortfolio);
  socket.emit('traders', traders);
  
  // Authenticate user (in a real app, this would validate credentials)
  socket.on('authenticate', ({ userId: authenticatedUserId }) => {
    console.log(`User ${authenticatedUserId} authenticated`);
    // In a real app, we would associate this socket with the authenticated user
  });
  
  // Get trader list
  socket.on('get_traders', () => {
    socket.emit('traders', traders);
  });
  
  // Get specific trader
  socket.on('get_trader', ({ traderId }) => {
    const trader = traders.find((t: any) => t.id === traderId);
    if (trader) {
      socket.emit('trader_data', trader);
    }
  });
  
  // Handle follow request
  socket.on('follow_trader', ({ traderId }) => {
    console.log(`Follow request for trader ${traderId}`);
    
    if (followTrader(userId, traderId)) {
      // Send updated portfolio
      const portfolio = getUserPortfolio(userId);
      socket.emit('portfolio_update', portfolio);
      socket.emit('follow_success', { traderId });
    }
  });
  
  // Handle unfollow request
  socket.on('unfollow_trader', ({ traderId }) => {
    console.log(`Unfollow request for trader ${traderId}`);
    
    if (unfollowTrader(userId, traderId)) {
      // Send updated portfolio
      const portfolio = getUserPortfolio(userId);
      socket.emit('portfolio_update', portfolio);
      socket.emit('unfollow_success', { traderId });
    }
  });
  
  // Handle copy trading settings
  socket.on('start_copy_trading', ({ traderId, settings }) => {
    console.log(`Start copy trading for trader ${traderId}`, settings);
    
    const updatedSettings = {
      ...settings,
      enabled: true
    };
    
    if (updateCopySettings(userId, traderId, updatedSettings)) {
      // Follow the trader if not already following
      followTrader(userId, traderId);
      
      // Send updated portfolio
      const portfolio = getUserPortfolio(userId);
      socket.emit('portfolio_update', portfolio);
      socket.emit('copy_settings_updated', { traderId, settings: updatedSettings });
    }
  });
  
  socket.on('stop_copy_trading', ({ traderId }) => {
    console.log(`Stop copy trading for trader ${traderId}`);
    
    const portfolio = getUserPortfolio(userId);
    if (portfolio && portfolio.copy_settings[traderId]) {
      portfolio.copy_settings[traderId].enabled = false;
      
      // Send updated portfolio
      socket.emit('portfolio_update', portfolio);
      socket.emit('copy_settings_updated', { traderId, enabled: false });
    }
  });
  
  socket.on('copy_portfolio_once', ({ traderId, settings }) => {
    console.log(`Copy portfolio once for trader ${traderId}`, settings);
    // This would execute a one-time copy of the trader's current positions
    // For the MVP, we'll just acknowledge the request
    socket.emit('portfolio_copied', { traderId });
  });
  
  // Update portfolio prices on demand
  socket.on('update_portfolio', async () => {
    await updatePortfolioPrices(userId);
    const portfolio = getUserPortfolio(userId);
    socket.emit('portfolio_update', portfolio);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Custom event handler for trade events
// We'll use our own implementation since we're in Node.js, not a browser
const tradeEventHandler = () => {
  // Monkey-patch the trade event
  const originalEmit = io.emit;
  io.emit = function(event: string, ...args: any[]) {
    if (event === 'trade') {
      // Process the trade for copy trading
      const trade = args[0];
      processTrade(trade).then(results => {
        results.forEach(({ userId, copyTrade }) => {
          // Emit a copy trade event
          io.emit('copy_trade', { userId, trade: copyTrade });
        });
      });
    }
    return originalEmit.apply(this, [event, ...args]);
  };
};

// Activate the trade event handler
tradeEventHandler();

// Start mock trading
startMockTrading(io);

// Start server
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access locally via: http://localhost:${PORT}`);
});

// Add graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  httpServer.close(() => {
    console.log('Server shut down');
    process.exit(0);
  });
});