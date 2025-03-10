// Mock user data
const user = {
  id: 1,
  name: "Demo User",
  balance: 50000,
  following: [1, 3], // Initially following traders 1 and 3
  portfolio: [
    {
      ticker: "AAPL",
      shares: 10,
      avg_price: 180.50,
      current_price: 185.20
    },
    {
      ticker: "NVDA",
      shares: 5,
      avg_price: 850.25,
      current_price: 920.50
    }
  ],
  trades: [],
  auto_copy: true,
  copy_amount: 1000 // Dollar amount to use for each copy trade
};

module.exports = { user };