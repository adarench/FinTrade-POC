import React, { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { Switch } from '@headlessui/react';

const CopyTradeSettings: React.FC = () => {
  const { user, toggleAutoCopy, setCopyAmount } = useUser();
  const [localCopyAmount, setLocalCopyAmount] = useState<string>('1000');
  
  if (!user) return null;

  const handleCopyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalCopyAmount(e.target.value);
  };
  
  const handleCopyAmountSubmit = () => {
    const amount = parseInt(localCopyAmount);
    if (!isNaN(amount) && amount > 0) {
      setCopyAmount(amount);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Copy Trading Settings</h3>
      
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Auto-Copy Trades</div>
            <div className="text-sm text-gray-400">
              Automatically copy trades from traders you follow
            </div>
          </div>
          <Switch
            checked={user.auto_copy}
            onChange={toggleAutoCopy}
            className={`${
              user.auto_copy ? 'bg-primary' : 'bg-gray-600'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-800`}
          >
            <span
              className={`${
                user.auto_copy ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="mb-2">
          <div className="font-medium">Copy Amount Per Trade</div>
          <div className="text-sm text-gray-400">
            Maximum amount to spend on each copied trade
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              $
            </span>
            <input
              type="number"
              min="1"
              step="100"
              value={localCopyAmount}
              onChange={handleCopyAmountChange}
              className="w-full pl-8 pr-4 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleCopyAmountSubmit}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-md"
          >
            Update
          </button>
        </div>
      </div>
      
      <div className="text-sm text-gray-400 mt-6">
        <div className="font-medium mb-1">How Auto-Copy Works</div>
        <p className="mb-2">
          When a trader you follow makes a trade, we'll automatically copy it using the amount specified above.
        </p>
        <p>
          <span className="text-warning">Note:</span> This is a simulated demo environment. No real trades are executed.
        </p>
      </div>
    </div>
  );
};

export default CopyTradeSettings;