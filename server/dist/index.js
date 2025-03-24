"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const path = __importStar(require("path"));
const mockTrading_1 = require("./mockTrading");
const portfolioManager_1 = require("./services/portfolioManager");
// Import trader data
const tradersPath = path.join(__dirname, 'data', 'traders');
const { traders } = require(tradersPath);
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*", // Allow all origins in development
        methods: ["GET", "POST"]
    }
});
// Enable CORS for all routes
app.use((0, cors_1.default)({
    origin: "*" // Allow all origins in development
}));
// REST API routes
app.get('/api/traders', (req, res) => {
    res.json(traders);
});
app.get('/api/trader/:id', (req, res) => {
    const traderId = parseInt(req.params.id);
    const trader = traders.find((t) => t.id === traderId);
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
    const userPortfolio = (0, portfolioManager_1.initializeUserPortfolio)(userId);
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
        const trader = traders.find((t) => t.id === traderId);
        if (trader) {
            socket.emit('trader_data', trader);
        }
    });
    // Handle follow request
    socket.on('follow_trader', ({ traderId }) => {
        console.log(`Follow request for trader ${traderId}`);
        if ((0, portfolioManager_1.followTrader)(userId, traderId)) {
            // Send updated portfolio
            const portfolio = (0, portfolioManager_1.getUserPortfolio)(userId);
            socket.emit('portfolio_update', portfolio);
            socket.emit('follow_success', { traderId });
        }
    });
    // Handle unfollow request
    socket.on('unfollow_trader', ({ traderId }) => {
        console.log(`Unfollow request for trader ${traderId}`);
        if ((0, portfolioManager_1.unfollowTrader)(userId, traderId)) {
            // Send updated portfolio
            const portfolio = (0, portfolioManager_1.getUserPortfolio)(userId);
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
        if ((0, portfolioManager_1.updateCopySettings)(userId, traderId, updatedSettings)) {
            // Follow the trader if not already following
            (0, portfolioManager_1.followTrader)(userId, traderId);
            // Send updated portfolio
            const portfolio = (0, portfolioManager_1.getUserPortfolio)(userId);
            socket.emit('portfolio_update', portfolio);
            socket.emit('copy_settings_updated', { traderId, settings: updatedSettings });
        }
    });
    socket.on('stop_copy_trading', ({ traderId }) => {
        console.log(`Stop copy trading for trader ${traderId}`);
        const portfolio = (0, portfolioManager_1.getUserPortfolio)(userId);
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
        await (0, portfolioManager_1.updatePortfolioPrices)(userId);
        const portfolio = (0, portfolioManager_1.getUserPortfolio)(userId);
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
    io.emit = function (event, ...args) {
        if (event === 'trade') {
            // Process the trade for copy trading
            const trade = args[0];
            (0, portfolioManager_1.processTrade)(trade).then(results => {
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
(0, mockTrading_1.startMockTrading)(io);
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
