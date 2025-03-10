import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useUser } from '@/contexts/UserContext';

const AlertManager: React.FC = () => {
  const { alerts, dismissAlert } = useUser();

  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm">
      {alerts.slice(0, 5).map((alert) => {
        let bgColor;
        switch (alert.type) {
          case 'success':
            bgColor = 'bg-success';
            break;
          case 'warning':
            bgColor = 'bg-warning';
            break;
          case 'danger':
            bgColor = 'bg-danger';
            break;
          default:
            bgColor = 'bg-primary';
        }

        return (
          <div 
            key={alert.id}
            className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-start justify-between animate-slideIn`}
          >
            <div>
              <div className="font-medium">{alert.trader_name}</div>
              <div className="text-sm">{alert.message}</div>
              <div className="text-xs opacity-75">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </div>
            </div>
            <button 
              onClick={() => dismissAlert(alert.id)}
              className="ml-2 text-white hover:text-gray-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        );
      })}
      
      {alerts.length > 5 && (
        <div className="text-center text-xs text-gray-400">
          +{alerts.length - 5} more alerts
        </div>
      )}
    </div>
  );
};

export default AlertManager;