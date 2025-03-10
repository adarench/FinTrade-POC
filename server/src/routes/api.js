const express = require('express');
const router = express.Router();
const { traders } = require('../data/traders');
const { user } = require('../data/user');

// Get all traders
router.get('/traders', (req, res) => {
  res.json(traders);
});

// Get a specific trader by ID
router.get('/traders/:id', (req, res) => {
  const trader = traders.find(t => t.id === parseInt(req.params.id));
  
  if (!trader) {
    return res.status(404).json({ message: 'Trader not found' });
  }
  
  res.json(trader);
});

// Get user data
router.get('/user', (req, res) => {
  res.json(user);
});

// Toggle following a trader
router.post('/user/follow/:id', (req, res) => {
  const traderId = parseInt(req.params.id);
  
  if (user.following.includes(traderId)) {
    // Unfollow
    user.following = user.following.filter(id => id !== traderId);
    
    // Find the trader and decrease followers
    const traderIndex = traders.findIndex(t => t.id === traderId);
    if (traderIndex !== -1) {
      traders[traderIndex].followers -= 1;
    }
  } else {
    // Follow
    user.following.push(traderId);
    
    // Find the trader and increase followers
    const traderIndex = traders.findIndex(t => t.id === traderId);
    if (traderIndex !== -1) {
      traders[traderIndex].followers += 1;
    }
  }
  
  res.json({ success: true, following: user.following });
});

// Toggle auto-copy setting
router.post('/user/auto-copy', (req, res) => {
  user.auto_copy = !user.auto_copy;
  res.json({ success: true, auto_copy: user.auto_copy });
});

// Set copy amount
router.post('/user/copy-amount', (req, res) => {
  const { amount } = req.body;
  
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }
  
  user.copy_amount = parseInt(amount);
  res.json({ success: true, copy_amount: user.copy_amount });
});

module.exports = router;