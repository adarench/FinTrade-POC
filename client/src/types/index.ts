export interface Trader {
  id: number;
  name: string;
  profilePic: string;
  followers: number;
  return_30d: number;
  win_rate: number;
  risk_level: 'Low' | 'Medium' | 'High';
  trades: Trade[];
  sharpe_ratio?: number;
  description?: string;
}

export interface Trade {
  id?: number;
  trader_id: number;
  ticker: string;
  action: 'BUY' | 'SELL';
  price: number;
  size: number;
  timestamp: string;
  pnl?: number;
}

export interface User {
  id: number;
  name: string;
  balance: number;
  following: number[];
  portfolio: UserHolding[];
  trades: Trade[];
  auto_copy: boolean;
  copy_amount: number;
}

export interface UserHolding {
  ticker: string;
  shares: number;
  avg_price: number;
  current_price: number;
}

export interface TradeAlert {
  id: number;
  message: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  trader_name: string;
  timestamp: string;
  trade: Trade;
}