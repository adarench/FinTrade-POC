import React from 'react';
import { CopySettings } from '@/types';

interface CopyTradeSettingsProps {
  settings: CopySettings;
  onUpdate: (field: keyof CopySettings, value: any) => void;
  onEnableChange: (enabled: boolean) => void;
  onCopyOnce: () => void;
}

const CopyTradeSettings: React.FC<CopyTradeSettingsProps> = ({ settings, onUpdate, onEnableChange, onCopyOnce }) => {
  return (
    <div className="bg-gray-800 rounded-xl p-6 space-y-6">
      <h2 className="text-xl font-semibold text-white mb-4">Copy Trade Settings</h2>

      {/* Auto-Copy Trades */}
      <div className="flex items-center justify-between">
        <label className="text-gray-300">Auto-Copy Trades</label>
        <div className="relative inline-block w-12 h-6">
          <input
            type="checkbox"
            className="sr-only"
            checked={settings.enabled}
            onChange={(e) => onEnableChange(e.target.checked)}
          />
          <div
            className={`block w-12 h-6 rounded-full transition-colors ${
              settings.enabled ? 'bg-blue-500' : 'bg-gray-600'
            }`}
          />
          <div
            className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${
              settings.enabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </div>
      </div>

      {/* Position Size Type */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Position Size Type
        </label>
        <select
          value={settings.position_size_type}
          onChange={(e) => onUpdate('position_size_type', e.target.value)}
          className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="fixed">Fixed Amount</option>
          <option value="percentage">Percentage of Portfolio</option>
        </select>
      </div>

      {/* Position Size */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          {settings.position_size_type === 'fixed' ? 'Fixed Amount ($)' : 'Portfolio Percentage (%)'}
        </label>
        <input
          type="number"
          value={settings.position_size}
          onChange={(e) => onUpdate('position_size', parseFloat(e.target.value))}
          className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          min="0"
        />
      </div>

      {/* Stop Loss */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Stop Loss (%)
        </label>
        <input
          type="number"
          value={settings.stop_loss_percentage}
          onChange={(e) => onUpdate('stop_loss_percentage', parseFloat(e.target.value))}
          className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          min="0"
          max="100"
        />
      </div>

      {/* Take Profit */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Take Profit (%)
        </label>
        <input
          type="number"
          value={settings.take_profit_percentage}
          onChange={(e) => onUpdate('take_profit_percentage', parseFloat(e.target.value))}
          className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          min="0"
        />
      </div>

      {/* Max Daily Loss */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Max Daily Loss ($)
        </label>
        <input
          type="number"
          value={settings.max_daily_loss}
          onChange={(e) => onUpdate('max_daily_loss', parseFloat(e.target.value))}
          className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          min="0"
        />
      </div>

      {/* Max Drawdown */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Max Drawdown (%)
        </label>
        <input
          type="number"
          value={settings.max_drawdown}
          onChange={(e) => onUpdate('max_drawdown', parseFloat(e.target.value))}
          className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          min="0"
          max="100"
        />
      </div>

      {/* Max Position Size */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Max Position Size
        </label>
        <input
          type="number"
          value={settings.max_position_size}
          onChange={(e) => onUpdate('max_position_size', parseFloat(e.target.value))}
          className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          min="0"
        />
      </div>

      <button
        onClick={onCopyOnce}
        className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        Copy Portfolio Once
      </button>
    </div>
  );
};

export default CopyTradeSettings;