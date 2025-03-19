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
    const newSocket = io('http://localhost:5001');

    newSocket.on('connect', () => {
      console.log('Connected to trading server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from trading server');
      setIsConnected(false);
    });

    // Handle incoming trades
    newSocket.on('trade', (trade: Trade) => {
      console.log('Received trade:', trade);
      if (!user) return;

      // Check if we're copying this trader
      const copySettings = user.copySettings?.[trade.trader_id];
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
        copySettings: {
          ...user.copySettings,
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
        copySettings: {
          ...user.copySettings,
          [traderId]: { ...user.copySettings?.[traderId], enabled: false },
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