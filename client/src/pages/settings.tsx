import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import Layout from '@/components/Layout';
import { RiskLevel, UserSettings } from '@/types';

const SettingsPage: React.FC = () => {
  const { user, updateUser } = useUser();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile settings
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  
  // Copy trading settings
  const [copyAmount, setCopyAmount] = useState(1000);
  const [maxPositionSize, setMaxPositionSize] = useState(10000);
  const [maxDrawdown, setMaxDrawdown] = useState(20);
  const [stopLoss, setStopLoss] = useState(2);
  const [takeProfit, setTakeProfit] = useState(4);
  
  // User preferences
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('Medium');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [maxDailyLoss, setMaxDailyLoss] = useState(500);

  // Update state when user data is loaded
  useEffect(() => {
    if (user) {
      // Profile
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatar(user.avatar || '');
      
      // Copy trading
      setCopyAmount(user.copy_amount || 1000);
      setMaxPositionSize(user.max_position_size || 10000);
      setMaxDrawdown(user.max_drawdown || 20);
      setStopLoss(user.stop_loss || 2);
      setTakeProfit(user.take_profit || 4);
      
      // User preferences
      setTheme(user.settings?.theme || 'dark');
      setRiskLevel(user.settings?.risk_level || 'Medium');
      setNotificationsEnabled(user.settings?.notifications || true);
      setEmailAlertsEnabled(user.settings?.email_alerts || true);
      setMaxDailyLoss(user.settings?.max_daily_loss || 500);
    }
  }, [user]);

  if (!user || !updateUser) {
    return (
      <Layout title="Settings">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-400">Loading your settings...</p>
        </div>
      </Layout>
    );
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      ...user,
      name,
      email,
      avatar,
    });
  };

  const handleTradingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      ...user,
      copy_amount: copyAmount,
      max_position_size: maxPositionSize,
      max_drawdown: maxDrawdown,
      stop_loss: stopLoss,
      take_profit: takeProfit,
    });
  };

  const handlePreferencesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings: UserSettings = {
      theme,
      risk_level: riskLevel,
      notifications: notificationsEnabled,
      email_alerts: emailAlertsEnabled,
      max_daily_loss: maxDailyLoss,
    };
    
    updateUser({
      ...user,
      settings: updatedSettings,
    });
  };

  const tabClass = (tab: string) => 
    `px-4 py-2 font-medium rounded-md cursor-pointer ${
      activeTab === tab 
        ? 'bg-blue-600 text-white' 
        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
    }`;

  return (
    <Layout title="Settings">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Account Settings</h1>
        
        {/* Tabs */}
        <div className="flex space-x-2 mb-6 bg-gray-800 p-2 rounded-lg">
          <div 
            className={tabClass('profile')}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </div>
          <div 
            className={tabClass('trading')}
            onClick={() => setActiveTab('trading')}
          >
            Trading
          </div>
          <div 
            className={tabClass('preferences')}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </div>
        </div>
        
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-4">Personal Information</h2>
              
              <div className="space-y-4">
                {/* Profile Picture */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-gray-700 overflow-hidden border-2 border-blue-500">
                    {avatar ? (
                      <img 
                        src={avatar} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Profile Picture URL
                    </label>
                    <input
                      type="text"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                    />
                  </div>
                </div>
                
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                    required
                  />
                </div>
                
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-4">Account Security</h2>
              
              <div className="space-y-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Change Password
                </button>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={true}
                      readOnly
                      className="h-4 w-4 text-blue-600 border-gray-600 rounded focus:ring-blue-500 bg-gray-700"
                    />
                    <span className="ml-2 text-gray-400">Enable two-factor authentication</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Save Profile
              </button>
            </div>
          </form>
        )}
        
        {/* Trading Tab */}
        {activeTab === 'trading' && (
          <form onSubmit={handleTradingSubmit} className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-4">Copy Trading Settings</h2>
              
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Default Copy Amount (USD)
                  </label>
                  <input
                    type="number"
                    value={copyAmount}
                    onChange={(e) => setCopyAmount(Number(e.target.value))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                    min="0"
                    step="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Maximum Position Size (USD)
                  </label>
                  <input
                    type="number"
                    value={maxPositionSize}
                    onChange={(e) => setMaxPositionSize(Number(e.target.value))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                    min="0"
                    step="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Maximum Drawdown (%)
                  </label>
                  <input
                    type="number"
                    value={maxDrawdown}
                    onChange={(e) => setMaxDrawdown(Number(e.target.value))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                    min="0"
                    max="100"
                    step="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Default Stop Loss (%)
                  </label>
                  <input
                    type="number"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(Number(e.target.value))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Default Take Profit (%)
                  </label>
                  <input
                    type="number"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(Number(e.target.value))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-4">Brokerage Connection</h2>
              
              <div className="flex items-center justify-between p-4 bg-gray-700 rounded-md mb-4">
                <div>
                  <p className="text-white font-medium">Demo Account</p>
                  <p className="text-xs text-gray-400">Connected: Demo Paper Trading</p>
                </div>
                <span className="px-2 py-1 bg-green-800 text-green-200 rounded-md text-xs">Active</span>
              </div>
              
              <button
                type="button"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
              >
                Connect Real Brokerage
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Save Trading Settings
              </button>
            </div>
          </form>
        )}
        
        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <form onSubmit={handlePreferencesSubmit} className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-4">Interface Preferences</h2>
              
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Theme
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Risk Tolerance
                  </label>
                  <select
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Max Daily Loss (USD)
                  </label>
                  <input
                    type="number"
                    value={maxDailyLoss}
                    onChange={(e) => setMaxDailyLoss(Number(e.target.value))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                    min="0"
                    step="100"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-4">Notifications</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white">In-app Notifications</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationsEnabled}
                      onChange={(e) => setNotificationsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-white">Email Alerts</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailAlertsEnabled}
                      onChange={(e) => setEmailAlertsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="pt-2">
                  <h3 className="text-white font-medium mb-2">Receive notifications for:</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={true}
                        className="h-4 w-4 text-blue-600 border-gray-600 rounded focus:ring-blue-500 bg-gray-700"
                      />
                      <span className="ml-2 text-gray-400">New trades from followed traders</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={true}
                        className="h-4 w-4 text-blue-600 border-gray-600 rounded focus:ring-blue-500 bg-gray-700"
                      />
                      <span className="ml-2 text-gray-400">Stop loss triggered</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={true}
                        className="h-4 w-4 text-blue-600 border-gray-600 rounded focus:ring-blue-500 bg-gray-700"
                      />
                      <span className="ml-2 text-gray-400">Take profit reached</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default SettingsPage;
