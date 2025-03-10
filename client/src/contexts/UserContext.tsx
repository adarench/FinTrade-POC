import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Trade, UserHolding, TradeAlert } from '@/types';
import { useSocket } from './SocketContext';
import { useTraders } from './TraderContext';

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  alerts: TradeAlert[];
  toggleFollowTrader: (traderId: number) => void;
  toggleAutoCopy: () => void;
  setCopyAmount: (amount: number) => void;
  dismissAlert: (alertId: number) => void;
  isFollowing: (traderId: number) => boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: false,
  error: null,
  alerts: [],
  toggleFollowTrader: () => {},
  toggleAutoCopy: () => {},
  setCopyAmount: () => {},
  dismissAlert: () => {},
  isFollowing: () => false,
});

export const useUser = () => useContext(UserContext);

// Helper function to update portfolio when a new trade happens
const updatePortfolio = (portfolio: UserHolding[], trade: Trade): UserHolding[] => {
  const existingPosition = portfolio.find(p => p.ticker === trade.ticker);
  
  if (!existingPosition) {
    // New position
    if (trade.action === 'BUY') {
      return [...portfolio, {
        ticker: trade.ticker,
        shares: trade.size,
        avg_price: trade.price,
        current_price: trade.price
      }];
    }
    // Can't sell what you don't have
    return portfolio;
  }
  
  // Update existing position
  return portfolio.map(position => {
    if (position.ticker !== trade.ticker) return position;
    
    if (trade.action === 'BUY') {
      // Add to position
      const totalShares = position.shares + trade.size;
      const totalCost = (position.shares * position.avg_price) + (trade.size * trade.price);
      return {
        ...position,
        shares: totalShares,
        avg_price: totalCost / totalShares,
        current_price: trade.price
      };
    } else {
      // Sell from position
      const newShares = Math.max(0, position.shares - trade.size);
      if (newShares === 0) {
        // Position closed
        return {
          ...position,
          shares: 0,
          current_price: trade.price
        };
      }
      return {
        ...position,
        shares: newShares,
        current_price: trade.price
      };
    }
  }).filter(position => position.shares > 0); // Remove positions with 0 shares
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<TradeAlert[]>([]);
  const { liveTrades } = useSocket();
  const { traders, followTrader, unfollowTrader } = useTraders();

  // Mock user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        // In a real app, this would be an API call
        // For now, we'll use dummy data
        const response = await fetch('http://localhost:5001/api/user');
        const data = await response.json();
        setUser(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to fetch user. Using mock data instead.');
        
        // Mock data for development
        const mockUser: User = {
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
        
        setUser(mockUser);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Handle auto-copying trades
  useEffect(() => {
    if (!user || !user.auto_copy || liveTrades.length === 0) return;
    
    const latestTrade = liveTrades[0];
    
    // Only copy trades from traders the user is following
    if (!user.following.includes(latestTrade.trader_id)) return;
    
    // Create a copy trade for the user
    const copyTrade: Trade = {
      ...latestTrade,
      id: undefined, // Will be assigned a new ID by the backend
      trader_id: user.id, // Assign to the user
      // Adjust size based on user's copy_amount
      size: Math.max(1, Math.floor(user.copy_amount / latestTrade.price))
    };
    
    // Calculate the trade cost
    const tradeCost = copyTrade.price * copyTrade.size * (copyTrade.action === 'BUY' ? 1 : -1);
    
    // Update user with the new trade
    setUser(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        balance: prev.balance - tradeCost,
        trades: [copyTrade, ...prev.trades],
        portfolio: updatePortfolio(prev.portfolio, copyTrade)
      };
    });
    
    // Create an alert for the trade
    const trader = traders.find(t => t.id === latestTrade.trader_id);
    const traderName = trader ? trader.name : 'Unknown Trader';
    
    const alert: TradeAlert = {
      id: Date.now(), // Simple unique ID
      trader_name: traderName,
      message: `${copyTrade.action === 'BUY' ? 'Bought' : 'Sold'} ${copyTrade.size} ${copyTrade.ticker} @ $${copyTrade.price.toFixed(2)}`,
      type: 'success',
      timestamp: new Date().toISOString(),
      trade: copyTrade
    };
    
    setAlerts(prev => [alert, ...prev]);
  }, [liveTrades, user, traders]);

  const toggleFollowTrader = (traderId: number) => {
    if (!user) return;
    
    const isCurrentlyFollowing = user.following.includes(traderId);
    
    // Update local user state
    setUser(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        following: isCurrentlyFollowing
          ? prev.following.filter(id => id !== traderId)
          : [...prev.following, traderId]
      };
    });
    
    // Update trader followers count
    if (isCurrentlyFollowing) {
      unfollowTrader(traderId);
    } else {
      followTrader(traderId);
    }
  };

  const toggleAutoCopy = () => {
    if (!user) return;
    
    setUser(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        auto_copy: !prev.auto_copy
      };
    });
  };

  const setCopyAmount = (amount: number) => {
    if (!user) return;
    
    setUser(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        copy_amount: amount
      };
    });
  };

  const dismissAlert = (alertId: number) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const isFollowing = (traderId: number) => {
    return user ? user.following.includes(traderId) : false;
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        error,
        alerts,
        toggleFollowTrader,
        toggleAutoCopy,
        setCopyAmount,
        dismissAlert,
        isFollowing
      }}
    >
      {children}
    </UserContext.Provider>
  );
};