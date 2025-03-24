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
  const names = [
    'Emma Thompson', 
    'Michael Chen', 
    'Sophia Rodriguez', 
    'Daniel Kim', 
    'Olivia Johnson',
    'Ethan Williams',
    'Ava Martinez',
    'Noah Garcia',
    'Isabella Lee',
    'Lucas Smith'
  ];

  // Professional-quality avatars with diverse representation
  const avatars = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=250&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=250&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=250&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=250&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=250&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=250&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=250&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=250&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=250&auto=format&fit=crop'
  ];

  // Expert backgrounds
  const backgrounds = [
    'Former Wall Street analyst with 12 years of experience',
    'Algorithmic trading expert with a background in machine learning',
    'Seasoned forex trader specializing in momentum strategies',
    'Certified financial planner with expertise in value investing',
    'Commodities specialist with a focus on energy markets',
    'Quantitative analyst with a PhD in Finance',
    'Day trader with 8+ years of consistent returns',
    'Options strategist specializing in income generation',
    'Growth investor with expertise in tech sector analysis',
    'Asset allocation expert with risk management specialization'
  ];

  for (let i = 0; i < 10; i++) {
    const monthlyReturn = (Math.random() * 40) - 10; // -10% to +30%
    const followers = Math.floor(Math.random() * 1000) + 50;
    const trades: Trade[] = generateMockTrades(i + 1);

    const winRate = Math.random() * 100;
    traders.push({
      id: i + 1,
      name: names[i],
      avatar: avatars[i],
      followers,
      trades,
      risk_level: (['Low', 'Medium', 'High'] as RiskLevel[])[Math.floor(Math.random() * 3)],
      description: backgrounds[i],
      joined_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      monthly_return: monthlyReturn,
      daily_return: monthlyReturn / 30,
      win_rate: winRate,
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
      const mockTraders = generateMockTraders();
      setTraders(mockTraders);
      setFilteredTraders(mockTraders);
      setIsLoading(false);
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