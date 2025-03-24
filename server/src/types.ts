export interface Trade {
  id?: number;
  trader_id: number;
  trader_name?: string;
  trader_avatar?: string;
  symbol: string;
  ticker?: string; // Alias for symbol for backward compatibility
  type: 'buy' | 'sell';
  action?: 'BUY' | 'SELL'; // Alias for type for backward compatibility
  quantity: number;
  size?: number; // Alias for quantity for backward compatibility
  price: number;
  profit_loss: number;
  pnl?: number; // Alias for profit_loss for backward compatibility
  timestamp: string;
}

export type TradingStrategy = 'Value' | 'Growth' | 'Momentum' | 'Meme' | 'Mixed' | 'Social' | 'ETF';
export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface Trader {
  id: number;
  name: string;
  profilePic: string;
  avatar?: string; // Alias for profilePic for backward compatibility
  followers: number;
  return_30d: number;
  monthly_return?: number; // Alias for return_30d for backward compatibility
  daily_return?: number;
  win_rate: number;
  risk_level: RiskLevel;
  trades: Trade[];
  sharpe_ratio?: number;
  description?: string;
  strategy: TradingStrategy;
  tradeFrequency: number; // Trades per hour
  avgSize: number; // Average position size in dollars
  preferredStocks: string[]; // List of preferred stocks to trade
}

export interface UserPortfolio {
  user_id: number;
  balance: number;
  holdings: PortfolioHolding[];
  history: Trade[]; // Historical trades
  total_pnl: number;
  traders_followed: number[];
  copy_settings: { [traderId: number]: CopySettings };
}

export interface PortfolioHolding {
  symbol: string;
  quantity: number;
  average_price: number;
  current_price: number;
  current_value: number;
  total_cost: number;
  unrealized_pnl: number;
  allocation_percent: number;
}

export interface CopySettings {
  enabled: boolean;
  position_size_type: 'fixed' | 'percentage';
  position_size: number; // Dollar amount or percentage
  max_position_size: number; // Maximum dollar amount per position
  max_daily_loss: number; // Maximum daily loss limit
  stop_loss_percentage?: number; // Optional stop loss 
  take_profit_percentage?: number; // Optional take profit
  max_drawdown?: number; // Maximum drawdown percentage
  require_confirmation?: boolean; // Whether to confirm trades manually
}