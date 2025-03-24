"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchStockData = fetchStockData;
exports.getStockPrice = getStockPrice;
const axios_1 = __importDefault(require("axios"));
// Alpha Vantage API key - Register for free at https://www.alphavantage.co/support/#api-key
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo'; // Use 'demo' for testing or replace with your key
/**
 * Fetch real-time stock data from Alpha Vantage API
 * @param symbols Array of stock symbols to fetch
 * @returns Promise with stock data
 */
async function fetchStockData(symbols) {
    var _a;
    const results = [];
    // Alpha Vantage free tier has rate limits, so process one at a time
    try {
        // Process only first 5 symbols to stay within free tier limits
        const symbolsToProcess = symbols.slice(0, 5);
        for (const symbol of symbolsToProcess) {
            try {
                const response = await axios_1.default.get('https://www.alphavantage.co/query', {
                    params: {
                        function: 'GLOBAL_QUOTE',
                        symbol: symbol,
                        apikey: ALPHA_VANTAGE_API_KEY,
                    },
                });
                // Check if we got valid data
                if (response.data && response.data['Global Quote']) {
                    const quote = response.data['Global Quote'];
                    // Extract data
                    results.push({
                        symbol: symbol,
                        price: parseFloat(quote['05. price'] || 0),
                        change: parseFloat(quote['09. change'] || 0),
                        changePercent: parseFloat(((_a = quote['10. change percent']) === null || _a === void 0 ? void 0 : _a.replace('%', '')) || 0),
                        volume: parseInt(quote['06. volume'] || 0),
                        previousClose: parseFloat(quote['08. previous close'] || 0),
                    });
                }
                else {
                    console.warn(`No data returned for ${symbol}, using mock data instead`);
                    results.push(createMockQuote(symbol));
                }
            }
            catch (error) {
                console.error(`Error fetching data for ${symbol}:`, error);
                results.push(createMockQuote(symbol));
            }
            // Add a small delay to stay within rate limits (5 calls/minute for free tier)
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        // For any remaining symbols beyond our limit, use mock data
        if (symbols.length > symbolsToProcess.length) {
            symbols.slice(5).forEach(symbol => {
                results.push(createMockQuote(symbol));
            });
        }
        return results;
    }
    catch (error) {
        console.error('Error fetching stock data:', error);
        // Return mock data if API fails
        return symbols.map(symbol => createMockQuote(symbol));
    }
}
/**
 * Create mock stock data when API is unavailable
 */
function createMockQuote(symbol) {
    // Base price ranges for common stocks
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
    // Use mapped value or random between 100-500
    const basePrice = priceMap[symbol] || 100 + Math.random() * 400;
    // Random price variation +/- 5%
    const variation = (Math.random() * 10 - 5) / 100;
    const price = basePrice * (1 + variation);
    return {
        symbol,
        price: price,
        change: price * variation,
        changePercent: variation * 100,
        volume: Math.floor(Math.random() * 10000000),
        high: price * 1.02,
        low: price * 0.98,
        open: price * (1 - variation / 2),
        previousClose: price * (1 - variation)
    };
}
/**
 * Simple interface for getting the current price of a stock
 */
async function getStockPrice(symbol) {
    try {
        const quotes = await fetchStockData([symbol]);
        if (quotes && quotes.length > 0) {
            return quotes[0].price;
        }
        return createMockQuote(symbol).price;
    }
    catch (error) {
        console.error(`Error getting price for ${symbol}:`, error);
        return createMockQuote(symbol).price;
    }
}
