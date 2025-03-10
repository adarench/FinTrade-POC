import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Trade } from '@/types';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  liveTrades: Trade[];
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  liveTrades: [],
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [liveTrades, setLiveTrades] = useState<Trade[]>([]);

  useEffect(() => {
    // Connect to WebSocket server
    const socketInstance = io('http://localhost:5001', {
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket server');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setConnected(false);
    });

    socketInstance.on('trade', (trade: Trade) => {
      console.log('New trade received:', trade);
      setLiveTrades((prev) => [trade, ...prev].slice(0, 100)); // Keep only the last 100 trades
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected, liveTrades }}>
      {children}
    </SocketContext.Provider>
  );
};