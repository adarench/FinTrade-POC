// Trader Domain
export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface Trade {
  id: number;
  trader_id: number;
  trader_name: string;
  trader_avatar?: string;
  symbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  profit_loss: number;
  timestamp: string;
}

export interface Trader {
  id: number;
  name: string;
  avatar?: string;
  risk_level: RiskLevel;
  monthly_return: number;
  daily_return: number;
  win_rate: number;
  followers: number;
  trades: Trade[];
  description?: string;
  joined_date?: string;
  return_30d?: number;
}

// User Domain
export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  balance: number;
  following: number[];
  trades: Trade[];
  settings: UserSettings;
  copy_settings: { [key: number]: CopySettings };
  copy_amount?: number;
  max_position_size?: number;
  max_drawdown?: number;
  stop_loss?: number;
  take_profit?: number;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  notifications: boolean;
  email_alerts: boolean;
  risk_level: RiskLevel;
  max_daily_loss: number;
}

export interface CopySettings {
  enabled: boolean;
  position_size_type: 'fixed' | 'percentage';
  position_size: number;
  max_position_size: number;
  stop_loss_percentage: number;
  take_profit_percentage: number;
  max_daily_loss: number;
  max_drawdown: number;
  // Aliases for backward compatibility
  sizeType?: 'fixed' | 'percentage';
  size?: number;
  stopLoss?: number;
  takeProfit?: number;
  maxDrawdown?: number;
  maxPositionSize?: number;
}

// Market Data Domain
export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  volume: number;
  timestamp: string;
}