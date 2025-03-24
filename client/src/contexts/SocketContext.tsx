import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from './UserContext';
import { Trade, CopySettings } from '@/types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  startCopyTrading: (traderId: number, settings: CopySettings) => void;
  stopCopyTrading: (traderId: number) => void;
  copyPortfolioOnce: (traderId: number, settings: CopySettings) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  startCopyTrading: () => {},
  stopCopyTrading: () => {},
  copyPortfolioOnce: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, updateUser } = useUser();

  useEffect(() => {
    // In a production environment, this would be your deployed server URL
    // const serverUrl = 'https://your-deployed-server.com';
    const serverUrl = 'http://localhost:5001'; 
    
    // For demo purposes, we'll continue with a mock experience when server isn't available
    let isDemo = false;
    const newSocket = io(serverUrl, {
      timeout: 5000,
      reconnectionAttempts: 3
    });

    newSocket.on('connect', () => {
      console.log('Connected to trading server');
      setIsConnected(true);
      isDemo = false;
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from trading server');
      setIsConnected(false);
    });
    
    // If we can't connect to the server, fallback to demo mode
    newSocket.on('connect_error', () => {
      if (!isDemo) {
        console.log('Using demo mode - trading server unavailable');
        isDemo = true;
        setupDemoMode();
      }
    });

    // Handle incoming trades
    newSocket.on('trade', (trade: Trade) => {
      console.log('Received trade:', trade);
      if (!user) return;

      // Check if we're copying this trader
      const copySettings = user.copy_settings?.[trade.trader_id];
      if (!copySettings?.enabled) return;

      // Calculate position size based on settings
      const tradeValue = trade.price * trade.quantity;
      let quantity = trade.quantity;

      if (copySettings.position_size_type === 'fixed') {
        quantity = Math.floor(copySettings.position_size / trade.price);
      } else {
        // Percentage of portfolio
        const portfolioValue = user.balance;
        quantity = Math.floor((portfolioValue * (copySettings.position_size / 100)) / trade.price);
      }

      // Apply position size limits
      if (tradeValue > copySettings.max_position_size) {
        quantity = Math.floor(copySettings.max_position_size / trade.price);
      }

      if (quantity <= 0) return;

      // Create a copy trade
      const copyTrade: Trade = {
        ...trade,
        id: Date.now(),
        trader_id: user.id,
        quantity,
        timestamp: new Date().toISOString(),
      };

      // Update user's trades
      if (updateUser) {
        const updatedUser = {
          ...user,
          trades: [...(user.trades || []), copyTrade],
          balance: user.balance + copyTrade.profit_loss,
        };
        updateUser(updatedUser);
      }
    });

    // Handle portfolio updates
    newSocket.on('portfolio_update', (update: any) => {
      console.log('Portfolio update:', update);
      if (!user || !updateUser) return;

      if (user.following.includes(update.trader_id)) {
        // Update trader performance metrics in user's following list
        const updatedFollowing = user.following.map(id => {
          if (id === update.trader_id) {
            return update.trader_id;
          }
          return id;
        });

        const updatedUser = {
          ...user,
          following: updatedFollowing,
        };
        updateUser(updatedUser);
      }
    });

    // Handle market data updates
    newSocket.on('market_data', (data: any) => {
      console.log('Market data:', data);
      // Update market data in state if needed
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user, updateUser]);

  const startCopyTrading = (traderId: number, settings: CopySettings) => {
    if (!socket || !user) return;
    console.log('Starting copy trading for trader:', traderId, settings);
    socket.emit('start_copy_trading', { traderId, settings });

    // Update user's copy settings
    if (updateUser) {
      const updatedUser = {
        ...user,
        copy_settings: {
          ...user.copy_settings,
          [traderId]: { ...settings, enabled: true },
        },
      };
      updateUser(updatedUser);
    }
  };

  const stopCopyTrading = (traderId: number) => {
    if (!socket || !user) return;
    console.log('Stopping copy trading for trader:', traderId);
    socket.emit('stop_copy_trading', { traderId });

    // Update user's copy settings
    if (updateUser) {
      const updatedUser = {
        ...user,
        copy_settings: {
          ...user.copy_settings,
          [traderId]: { ...user.copy_settings?.[traderId], enabled: false },
        },
      };
      updateUser(updatedUser);
    }
  };

  const copyPortfolioOnce = (traderId: number, settings: CopySettings) => {
    if (!socket || !user) return;
    console.log('Copying portfolio once for trader:', traderId, settings);
    socket.emit('copy_portfolio_once', { traderId, settings });
  };

  // Setup a demo mode that simulates server behavior when no connection is available
  const setupDemoMode = () => {
    // Make sure we consider socket as connected for UI purposes
    setIsConnected(true);
    
    // Generate mock trades on a regular interval
    const symbols = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX', 'DIS'];
    const traders = Array.from({ length: 7 }, (_, i) => i + 1); // Use 7 traders to match our personas
    
    // Generate trader names that match our personas
    const traderNames = {
      1: "Buffett_Bot",
      2: "CathieWoodAI", 
      3: "RealPhilTown",
      4: "MemeStockLegend",
      5: "YourFriendMike",
      6: "RedditInvestor42",
      7: "IndexETFQueen"
    };
    
    // Emit a fake trade every 3-8 seconds (more frequent than before)
    const tradeInterval = setInterval(() => {
      if (!user) return;
      
      const randomTraderId = traders[Math.floor(Math.random() * traders.length)];
      const following = user.following || [];
      
      // Create a mock trade
      const mockTrade: Trade = {
        id: Date.now(),
        trader_id: randomTraderId,
        trader_name: traderNames[randomTraderId as keyof typeof traderNames] || `Trader ${randomTraderId}`,
        trader_avatar: `/avatars/trader${randomTraderId}.jpg`,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        type: Math.random() > 0.5 ? 'buy' : 'sell',
        quantity: Math.floor(Math.random() * 100) + 1,
        price: Math.floor(Math.random() * 1000) + 50,
        profit_loss: (Math.random() - 0.4) * 200, // Slight bias towards profit
        timestamp: new Date().toISOString(),
      };
      
      // Emit trade event
      console.log('Demo mode: Generated mock trade', mockTrade);
      const tradeEvent = new CustomEvent('demo:trade', { detail: mockTrade });
      window.dispatchEvent(tradeEvent);
      
      // Process copy trades AFTER the original trade is emitted
      if (following.includes(mockTrade.trader_id) && updateUser) {
        const copySettings = user.copy_settings?.[mockTrade.trader_id];
        
        // Generate a copy trade even if settings are not explicitly enabled
        const shouldCopy = copySettings?.enabled !== false; // Default to true if undefined
        
        if (shouldCopy) {
          // Calculate copy size based on settings or default
          let quantity = mockTrade.quantity;
          
          if (copySettings) {
            // Apply position sizing rules
            if (copySettings.position_size_type === 'fixed') {
              // Fixed dollar amount
              quantity = Math.floor(copySettings.position_size / mockTrade.price);
            } else if (copySettings.position_size_type === 'percentage') {
              // Percentage of portfolio
              quantity = Math.floor((user.balance * (copySettings.position_size / 100)) / mockTrade.price);
            }
            
            // Apply position size limits
            if (copySettings.max_position_size && quantity * mockTrade.price > copySettings.max_position_size) {
              quantity = Math.floor(copySettings.max_position_size / mockTrade.price);
            }
          }
          
          if (quantity <= 0) quantity = 1; // Ensure at least 1 share
          
          // Create a copy of the trade for the user
          const copyTrade: Trade = {
            ...mockTrade,
            id: Date.now() + 1,
            trader_id: user.id,
            trader_name: user.name || "You",
            trader_avatar: user.avatar || "/avatars/default.jpg",
            quantity: quantity,
            profit_loss: (mockTrade.profit_loss / mockTrade.quantity) * quantity, // Scale P&L to new quantity
          };
          
          // Update user's trades and balance
          updateUser({
            ...user,
            trades: [...(user.trades || []), copyTrade],
            balance: user.balance + copyTrade.profit_loss,
          });
          
          // Emit copy trade event
          console.log('Demo mode: Generated copy trade', copyTrade);
          const copyEvent = new CustomEvent('demo:copy_trade', { 
            detail: { userId: user.id, trade: copyTrade } 
          });
          window.dispatchEvent(copyEvent);
        }
      }
    }, Math.random() * 5000 + 3000); // 3-8 seconds interval for more activity
    
    // Generate market data updates every second
    const marketInterval = setInterval(() => {
      symbols.forEach(symbol => {
        const basePrice = {
          'AAPL': 180, 'TSLA': 180, 'MSFT': 390, 'GOOGL': 150, 
          'AMZN': 170, 'META': 480, 'NFLX': 600, 'DIS': 110
        }[symbol] || 100;
        
        const change = (Math.random() * 2 - 1) * (basePrice * 0.01); // ±1% change
        
        const marketData = {
          symbol,
          price: basePrice + change,
          change: change,
          volume: Math.floor(Math.random() * 1000000),
          timestamp: new Date().toISOString()
        };
        
        const marketEvent = new CustomEvent('demo:market_data', { detail: marketData });
        window.dispatchEvent(marketEvent);
      });
    }, 1000);
    
    // Clean up when component unmounts
    return () => {
      clearInterval(tradeInterval);
      clearInterval(marketInterval);
    };
  };

  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected,
      startCopyTrading,
      stopCopyTrading,
      copyPortfolioOnce,
    }}>
      {children}
    </SocketContext.Provider>
  );
};