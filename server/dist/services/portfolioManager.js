"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeUserPortfolio = initializeUserPortfolio;
exports.getUserPortfolio = getUserPortfolio;
exports.getAllUserPortfolios = getAllUserPortfolios;
exports.followTrader = followTrader;
exports.unfollowTrader = unfollowTrader;
exports.updateCopySettings = updateCopySettings;
exports.processTrade = processTrade;
exports.executeTrade = executeTrade;
exports.updatePortfolioPrices = updatePortfolioPrices;
const yahooFinance_1 = require("./yahooFinance");
// In-memory storage of user portfolios for demo
const userPortfolios = new Map();
/**
 * Initialize a new user portfolio
 */
function initializeUserPortfolio(userId, initialBalance = 100000) {
    const portfolio = {
        user_id: userId,
        balance: initialBalance,
        holdings: [],
        history: [],
        total_pnl: 0,
        traders_followed: [],
        copy_settings: {}
    };
    userPortfolios.set(userId, portfolio);
    return portfolio;
}
/**
 * Get a user's portfolio
 */
function getUserPortfolio(userId) {
    return userPortfolios.get(userId);
}
/**
 * Get all user portfolios
 */
function getAllUserPortfolios() {
    return Array.from(userPortfolios.values());
}
/**
 * Add a trader to follow
 */
function followTrader(userId, traderId) {
    const portfolio = userPortfolios.get(userId);
    if (!portfolio)
        return false;
    if (!portfolio.traders_followed.includes(traderId)) {
        portfolio.traders_followed.push(traderId);
        return true;
    }
    return false;
}
/**
 * Remove a trader from followed list
 */
function unfollowTrader(userId, traderId) {
    const portfolio = userPortfolios.get(userId);
    if (!portfolio)
        return false;
    portfolio.traders_followed = portfolio.traders_followed.filter(id => id !== traderId);
    // Also disable copy trading if it was enabled
    if (portfolio.copy_settings[traderId]) {
        portfolio.copy_settings[traderId].enabled = false;
    }
    return true;
}
/**
 * Update copy trading settings for a trader
 */
function updateCopySettings(userId, traderId, settings) {
    const portfolio = userPortfolios.get(userId);
    if (!portfolio)
        return false;
    // Ensure we're following this trader
    if (!portfolio.traders_followed.includes(traderId)) {
        portfolio.traders_followed.push(traderId);
    }
    // Update settings
    portfolio.copy_settings[traderId] = settings;
    return true;
}
/**
 * Process a trade from a trader and apply it to user portfolios that are copy trading
 */
async function processTrade(trade) {
    const results = [];
    // Check all user portfolios
    for (const [userId, portfolio] of userPortfolios.entries()) {
        // Skip if not following this trader
        if (!portfolio.traders_followed.includes(trade.trader_id))
            continue;
        // Skip if copy trading not enabled
        const settings = portfolio.copy_settings[trade.trader_id];
        if (!settings || !settings.enabled)
            continue;
        try {
            // Calculate position size based on settings
            const tradeValue = trade.price * trade.quantity;
            let quantity = trade.quantity;
            if (settings.position_size_type === 'fixed') {
                quantity = Math.floor(settings.position_size / trade.price);
            }
            else {
                // Percentage of portfolio
                const portfolioValue = portfolio.balance;
                quantity = Math.floor((portfolioValue * (settings.position_size / 100)) / trade.price);
            }
            // Apply position size limits
            if (quantity * trade.price > settings.max_position_size) {
                quantity = Math.floor(settings.max_position_size / trade.price);
            }
            if (quantity <= 0)
                continue;
            // Create copy trade
            const copyTrade = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                trader_id: userId,
                symbol: trade.symbol,
                type: trade.type,
                quantity,
                price: trade.price,
                profit_loss: 0, // Will calculate after execution
                timestamp: new Date().toISOString()
            };
            // Execute the trade on the user's portfolio
            const success = await executeTrade(userId, copyTrade);
            if (success) {
                results.push({ userId, copyTrade });
            }
        }
        catch (error) {
            console.error(`Error processing trade for user ${userId}:`, error);
        }
    }
    return results;
}
/**
 * Execute a trade on a user's portfolio
 */
async function executeTrade(userId, trade) {
    const portfolio = userPortfolios.get(userId);
    if (!portfolio)
        return false;
    // Get current price
    let currentPrice = trade.price;
    try {
        currentPrice = await (0, yahooFinance_1.getStockPrice)(trade.symbol);
    }
    catch (error) {
        console.error(`Failed to get current price for ${trade.symbol}, using trade price`);
    }
    const tradeValue = currentPrice * trade.quantity;
    // For buy orders, check if user has enough balance
    if (trade.type === 'buy') {
        if (portfolio.balance < tradeValue) {
            console.error(`User ${userId} has insufficient balance for trade`);
            return false;
        }
        // Update balance
        portfolio.balance -= tradeValue;
        // Update holdings
        const existingHolding = portfolio.holdings.find(h => h.symbol === trade.symbol);
        if (existingHolding) {
            // Update existing holding
            const totalShares = existingHolding.quantity + trade.quantity;
            const totalCost = existingHolding.total_cost + tradeValue;
            existingHolding.quantity = totalShares;
            existingHolding.total_cost = totalCost;
            existingHolding.average_price = totalCost / totalShares;
            existingHolding.current_price = currentPrice;
            existingHolding.current_value = currentPrice * totalShares;
            existingHolding.unrealized_pnl = existingHolding.current_value - existingHolding.total_cost;
        }
        else {
            // Add new holding
            portfolio.holdings.push({
                symbol: trade.symbol,
                quantity: trade.quantity,
                average_price: currentPrice,
                current_price: currentPrice,
                current_value: tradeValue,
                total_cost: tradeValue,
                unrealized_pnl: 0,
                allocation_percent: (tradeValue / calculateTotalPortfolioValue(portfolio)) * 100
            });
        }
    }
    else if (trade.type === 'sell') {
        // Find the holding
        const existingHolding = portfolio.holdings.find(h => h.symbol === trade.symbol);
        if (!existingHolding || existingHolding.quantity < trade.quantity) {
            console.error(`User ${userId} doesn't have enough shares of ${trade.symbol} to sell`);
            return false;
        }
        // Calculate profit/loss
        const averageCost = existingHolding.average_price * trade.quantity;
        const saleValue = currentPrice * trade.quantity;
        trade.profit_loss = saleValue - averageCost;
        // Update balance
        portfolio.balance += saleValue;
        portfolio.total_pnl += trade.profit_loss;
        // Update holdings
        if (existingHolding.quantity === trade.quantity) {
            // Remove holding completely
            portfolio.holdings = portfolio.holdings.filter(h => h.symbol !== trade.symbol);
        }
        else {
            // Reduce holding
            existingHolding.quantity -= trade.quantity;
            existingHolding.total_cost -= averageCost;
            existingHolding.current_value = existingHolding.quantity * currentPrice;
            existingHolding.unrealized_pnl = existingHolding.current_value - existingHolding.total_cost;
        }
    }
    // Update allocations
    updateAllocations(portfolio);
    // Add to history
    portfolio.history.unshift(trade);
    return true;
}
/**
 * Update the allocation percentages for all holdings
 */
function updateAllocations(portfolio) {
    const totalValue = calculateTotalPortfolioValue(portfolio);
    portfolio.holdings.forEach(holding => {
        holding.allocation_percent = (holding.current_value / totalValue) * 100;
    });
}
/**
 * Calculate the total value of a portfolio (cash + holdings)
 */
function calculateTotalPortfolioValue(portfolio) {
    const holdingsValue = portfolio.holdings.reduce((total, holding) => total + holding.current_value, 0);
    return portfolio.balance + holdingsValue;
}
/**
 * Update portfolio holdings with current prices
 */
async function updatePortfolioPrices(userId) {
    const portfolio = userPortfolios.get(userId);
    if (!portfolio)
        return false;
    // Get symbols
    const symbols = portfolio.holdings.map(h => h.symbol);
    if (symbols.length === 0)
        return true;
    try {
        // Update each holding
        for (const holding of portfolio.holdings) {
            const currentPrice = await (0, yahooFinance_1.getStockPrice)(holding.symbol);
            holding.current_price = currentPrice;
            holding.current_value = currentPrice * holding.quantity;
            holding.unrealized_pnl = holding.current_value - holding.total_cost;
        }
        // Update allocations
        updateAllocations(portfolio);
        return true;
    }
    catch (error) {
        console.error(`Error updating portfolio prices for user ${userId}:`, error);
        return false;
    }
}
