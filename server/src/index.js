const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const apiRoutes = require('./routes/api');
const { generateRandomTrade, traders } = require('./data/traders');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', apiRoutes);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start generating trades
  startTradeGenerator();
});

// Function to generate random trades and emit via socket
function startTradeGenerator() {
  // Keep track of last 50 trades for each trader
  const MAX_TRADES_PER_TRADER = 50;
  
  // Generate a trade every 3-5 seconds
  setInterval(() => {
    const trade = generateRandomTrade();
    
    // Add the trade to the trader's trades array
    const traderIndex = traders.findIndex(t => t.id === trade.trader_id);
    if (traderIndex !== -1) {
      traders[traderIndex].trades.unshift(trade);
      
      // Limit to MAX_TRADES_PER_TRADER trades
      if (traders[traderIndex].trades.length > MAX_TRADES_PER_TRADER) {
        traders[traderIndex].trades = traders[traderIndex].trades.slice(0, MAX_TRADES_PER_TRADER);
      }
    }
    
    // Emit the trade to all connected clients
    io.emit('trade', trade);
    
    console.log(`New trade: ${trade.action} ${trade.size} ${trade.ticker} @ ${trade.price.toFixed(2)} by Trader #${trade.trader_id}`);
  }, Math.floor(Math.random() * 2000) + 3000); // Random interval between 3-5 seconds
}