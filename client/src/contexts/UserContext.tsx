import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Trade, UserSettings, CopySettings } from '@/types';

interface UserContextType {
  user: User | null;
  updateUser: ((user: User) => void) | null;
}

const UserContext = createContext<UserContextType>({
  user: null,
  updateUser: null,
});

export const useUser = () => useContext(UserContext);

// Generate mock trades for testing
const generateMockTrades = (): Trade[] => {
  const trades: Trade[] = [];
  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
  
  for (let i = 0; i < 10; i++) {
    const price = Math.random() * 1000 + 50;
    const quantity = Math.floor(Math.random() * 100) + 1;
    const profit_loss = (Math.random() * 200) - 100;
    
    trades.push({
      id: i + 1,
      trader_id: Math.floor(Math.random() * 5) + 1,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      type: Math.random() > 0.5 ? 'buy' : 'sell',
      price,
      quantity,
      profit_loss,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  
  return trades;
};

// Generate mock user settings
const generateMockSettings = (): UserSettings => {
  return {
    theme: 'dark',
    notifications: true,
    email_alerts: true,
    risk_level: 'Medium',
    max_daily_loss: 500,
  };
};

// Generate mock copy settings
const generateMockCopySettings = (): { [traderId: number]: CopySettings } => {
  return {
    1: {
      enabled: false,
      position_size_type: 'fixed',
      position_size: 1000,
      max_position_size: 10000,
      stop_loss_percentage: 2,
      take_profit_percentage: 4,
      max_daily_loss: 500,
      max_drawdown: 20,
    }
  };
};

// Generate mock user data
const generateMockUser = (): User => {
  return {
    id: 1,
    name: 'Demo User',
    email: 'demo@example.com',
    balance: 100000,
    following: [1, 3], // Start with following a couple traders
    trades: generateMockTrades(),
    settings: generateMockSettings(),
    copySettings: generateMockCopySettings(),
  };
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start with null to avoid hydration issues
  const [user, setUser] = useState<User | null>(null);

  // Initialize with mock data only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUser(generateMockUser());
    }
  }, []);

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <UserContext.Provider value={{ user, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};