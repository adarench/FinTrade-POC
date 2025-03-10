import React, { createContext, useContext, useEffect, useState } from 'react';
import { Trader, Trade } from '@/types';
import { useSocket } from './SocketContext';

interface TraderContextType {
  traders: Trader[];
  isLoading: boolean;
  error: string | null;
  getTraderById: (id: number) => Trader | undefined;
  followTrader: (traderId: number) => void;
  unfollowTrader: (traderId: number) => void;
}

const TraderContext = createContext<TraderContextType>({
  traders: [],
  isLoading: false,
  error: null,
  getTraderById: () => undefined,
  followTrader: () => {},
  unfollowTrader: () => {},
});

export const useTraders = () => useContext(TraderContext);

export const TraderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { liveTrades } = useSocket();

  // Fetch traders from API
  useEffect(() => {
    const fetchTraders = async () => {
      try {
        setIsLoading(true);
        // In a real app, this would be an API call
        // For now, we'll use dummy data
        const response = await fetch('http://localhost:5001/api/traders');
        const data = await response.json();
        setTraders(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching traders:', err);
        setError('Failed to fetch traders. Using mock data instead.');
        
        // Mock data for development
        const mockTraders: Trader[] = [
          {
            id: 1,
            name: "HFT God",
            profilePic: "https://randomuser.me/api/portraits/men/32.jpg",
            followers: 2563,
            return_30d: 14.2,
            win_rate: 67,
            risk_level: "High",
            sharpe_ratio: 1.8,
            description: "High-frequency momentum trader specializing in tech stocks",
            trades: []
          },
          {
            id: 2,
            name: "Swing Queen",
            profilePic: "https://randomuser.me/api/portraits/women/44.jpg",
            followers: 1872,
            return_30d: 8.7,
            win_rate: 72,
            risk_level: "Medium",
            sharpe_ratio: 2.1,
            description: "Swing trader with focus on biotech and healthcare",
            trades: []
          },
          {
            id: 3,
            name: "Crypto Whale",
            profilePic: "https://randomuser.me/api/portraits/men/21.jpg",
            followers: 4215,
            return_30d: 22.5,
            win_rate: 59,
            risk_level: "High",
            sharpe_ratio: 1.5,
            description: "Aggressive crypto trader with high risk tolerance",
            trades: []
          },
          {
            id: 4,
            name: "Value Investor",
            profilePic: "https://randomuser.me/api/portraits/women/28.jpg",
            followers: 1053,
            return_30d: 5.3,
            win_rate: 83,
            risk_level: "Low",
            sharpe_ratio: 2.7,
            description: "Long-term value investor focusing on blue chip stocks",
            trades: []
          },
          {
            id: 5,
            name: "Options Master",
            profilePic: "https://randomuser.me/api/portraits/men/15.jpg",
            followers: 3127,
            return_30d: 17.8,
            win_rate: 63,
            risk_level: "High",
            sharpe_ratio: 1.9,
            description: "Options trading specialist with focus on tech and finance",
            trades: []
          }
        ];
        
        setTraders(mockTraders);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTraders();
  }, []);

  // Update trader trades when new live trades come in
  useEffect(() => {
    if (liveTrades.length === 0) return;
    
    const latestTrade = liveTrades[0];
    
    setTraders(prev => prev.map(trader => {
      if (trader.id === latestTrade.trader_id) {
        return {
          ...trader,
          trades: [latestTrade, ...trader.trades].slice(0, 50) // Keep only the last 50 trades
        };
      }
      return trader;
    }));
  }, [liveTrades]);

  const getTraderById = (id: number) => {
    return traders.find(trader => trader.id === id);
  };

  const followTrader = (traderId: number) => {
    setTraders(prev => prev.map(trader => {
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
    setTraders(prev => prev.map(trader => {
      if (trader.id === traderId) {
        return {
          ...trader,
          followers: Math.max(0, trader.followers - 1)
        };
      }
      return trader;
    }));
  };

  return (
    <TraderContext.Provider 
      value={{ 
        traders, 
        isLoading, 
        error, 
        getTraderById,
        followTrader,
        unfollowTrader
      }}
    >
      {children}
    </TraderContext.Provider>
  );
};