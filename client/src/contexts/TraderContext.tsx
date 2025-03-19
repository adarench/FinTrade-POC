import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { Trader, Trade, RiskLevel } from '@/types';

interface TraderContextType {
  traders: Trader[];
  isLoading: boolean;
  error: string | null;
  getTraderById: (id: number) => Trader | undefined;
  followTrader: (traderId: number) => void;
  unfollowTrader: (traderId: number) => void;
  sortTraders: (by: keyof Trader, order: 'asc' | 'desc') => void;
  filterTraders: (risk: 'Low' | 'Medium' | 'High' | 'all') => void;
}

const TraderContext = createContext<TraderContextType>({
  traders: [],
  isLoading: false,
  error: null,
  getTraderById: () => undefined,
  followTrader: () => {},
  unfollowTrader: () => {},
  sortTraders: () => {},
  filterTraders: () => {},
});

export const useTraders = () => useContext(TraderContext);

// Generate mock trades for testing
const generateMockTrades = (traderId: number, count: number = 10): Trade[] => {
  const trades: Trade[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const price = Math.random() * 1000 + 100;
    const quantity = Math.floor(Math.random() * 100) + 1;
    const type = Math.random() > 0.5 ? 'buy' : 'sell';
    const profit = (Math.random() - 0.3) * 1000; // Slight bias towards profit

    trades.push({
      id: i + 1,
      trader_id: traderId,
      trader_name: `Trader ${traderId}`,
      trader_avatar: `/avatars/trader${traderId}.jpg`,
      symbol: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'][Math.floor(Math.random() * 5)],
      type,
      quantity,
      price,
      profit_loss: profit,
      timestamp: new Date(now.getTime() - i * 3600000).toISOString(),
    });
  }

  return trades;
};

const generateMockTrader = (id: number): Trader => {
  const trades = generateMockTrades(id);
  const winningTrades = trades.filter(t => t.profit_loss > 0).length;
  const winRate = (winningTrades / trades.length) * 100;
  const monthlyReturn = trades.reduce((sum, t) => sum + t.profit_loss, 0);
  const dailyReturn = monthlyReturn / 30;

  const riskLevels: RiskLevel[] = ['Low', 'Medium', 'High'];
  const risk_level = riskLevels[Math.floor(Math.random() * riskLevels.length)];

  return {
    id,
    name: `Trader ${id}`,
    avatar: `/avatars/trader${id}.jpg`,
    risk_level,
    monthly_return: monthlyReturn,
    daily_return: dailyReturn,
    win_rate: winRate,
    followers: Math.floor(Math.random() * 1000),
    trades,
  };
};

const generateMockTraders = (): Trader[] => {
  const traders: Trader[] = [];
  const names = ['John Smith', 'Alice Johnson', 'Bob Wilson', 'Emma Davis', 'Michael Brown'];

  for (let i = 0; i < 5; i++) {
    const monthlyReturn = (Math.random() * 40) - 10; // -10% to +30%
    const followers = Math.floor(Math.random() * 1000);
    const trades: Trade[] = generateMockTrades(i + 1);

    traders.push({
      id: i + 1,
      name: names[i],
      avatar: `/avatars/trader${i + 1}.jpg`,
      followers,
      trades,
      risk_level: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
      description: `Professional trader with ${Math.floor(Math.random() * 10 + 1)} years of experience.`,
      joined_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      monthly_return: monthlyReturn,
    });
  }

  return traders;
};

export const TraderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use an empty array for initial state to avoid hydration issues
  const [traders, setTraders] = useState<Trader[]>([]);
  const [filteredTraders, setFilteredTraders] = useState<Trader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();
  
  // Initialize with mock data only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTraders(generateMockTraders());
      setFilteredTraders(generateMockTraders());
    }
  }, []);

  // Listen for trader updates from socket
  useEffect(() => {
    if (!socket) return;

    socket.on('traders', (updatedTraders: Trader[]) => {
      console.log('Received traders update:', updatedTraders);
      // Ensure we have valid data
      const validTraders = Array.isArray(updatedTraders) 
        ? updatedTraders.filter(trader => trader && typeof trader === 'object')
        : [];
        
      setTraders(validTraders);
      setFilteredTraders(validTraders);
      setIsLoading(false);
    });

    socket.on('connect', () => {
      setIsLoading(true);
      socket.emit('get_traders'); // Request initial traders data
    });

    socket.on('connect_error', () => {
      setError('Failed to connect to trading server');
      setIsLoading(false);
    });

    // Listen for individual trader updates
    socket.on('trader_update', (updatedTrader: Trader) => {
      // Validate the updatedTrader
      if (!updatedTrader || typeof updatedTrader !== 'object' || !updatedTrader.id) {
        console.warn('Received invalid trader update:', updatedTrader);
        return;
      }
      
      setTraders(prev => prev.map(trader => 
        trader && trader.id === updatedTrader.id ? updatedTrader : trader
      ));
      setFilteredTraders(prev => prev.map(trader => 
        trader && trader.id === updatedTrader.id ? updatedTrader : trader
      ));
    });

    // Request initial traders data if already connected
    if (socket.connected) {
      socket.emit('get_traders');
    }

    return () => {
      socket.off('traders');
      socket.off('connect');
      socket.off('connect_error');
      socket.off('trader_update');
    };
  }, [socket]);

  const getTraderById = (id: number) => {
    return traders.find(trader => trader.id === id);
  };

  const followTrader = (traderId: number) => {
    // Emit follow event to server
    if (socket) {
      socket.emit('follow_trader', { traderId });
    }
    
    // Update local state
    setTraders(prev => prev.map(trader => {
      if (trader.id === traderId) {
        return {
          ...trader,
          followers: trader.followers + 1
        };
      }
      return trader;
    }));
    setFilteredTraders(prev => prev.map(trader => {
      if (trader.id === traderId) {
        return {
          ...trader,
          followers: trader.followers + 1
        };
      }
      return trader;
    }));
  };

  const unfollowTrader = (traderId: number) => {
    // Emit unfollow event to server
    if (socket) {
      socket.emit('unfollow_trader', { traderId });
    }
    
    // Update local state
    setTraders(prev => prev.map(trader => {
      if (trader.id === traderId) {
        return {
          ...trader,
          followers: Math.max(0, trader.followers - 1)
        };
      }
      return trader;
    }));
    setFilteredTraders(prev => prev.map(trader => {
      if (trader.id === traderId) {
        return {
          ...trader,
          followers: Math.max(0, trader.followers - 1)
        };
      }
      return trader;
    }));
  };

  const sortTraders = (by: keyof Trader, order: 'asc' | 'desc') => {
    const sorted = [...filteredTraders].sort((a, b) => {
      const aValue = a[by];
      const bValue = b[by];
      const multiplier = order === 'asc' ? 1 : -1;
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * multiplier;
      }
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * multiplier;
      }
      return 0;
    });
    setFilteredTraders(sorted);
  };

  const filterTraders = (risk: 'Low' | 'Medium' | 'High' | 'all') => {
    if (risk === 'all') {
      setFilteredTraders(traders);
    } else {
      const filtered = traders.filter(trader => trader.risk_level === risk);
      setFilteredTraders(filtered);
    }
  };

  return (
    <TraderContext.Provider 
      value={{ 
        traders: filteredTraders, 
        isLoading, 
        error, 
        getTraderById,
        followTrader,
        unfollowTrader,
        sortTraders,
        filterTraders,
      }}
    >
      {children}
    </TraderContext.Provider>
  );
};