import React, { useEffect, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useTraders } from '@/contexts/TraderContext';
import Link from 'next/link';
import Image from 'next/image';

const CopyTradeStatus: React.FC = () => {
  const { user } = useUser();
  const { traders } = useTraders();
  const [expanded, setExpanded] = useState(false);
  const [copyingTraders, setCopyingTraders] = useState<{
    id: number;
    name: string;
    avatar?: string;
  }[]>([]);

  useEffect(() => {
    if (!user || !traders) return;

    // Find traders that we are actively copy trading
    const activeCopying = traders.filter(trader => {
      return user.following.includes(trader.id) && 
             user.copy_settings?.[trader.id]?.enabled === true;
    });

    setCopyingTraders(activeCopying.map(t => ({
      id: t.id,
      name: t.name,
      avatar: t.avatar || `/avatars/trader${t.id}.jpg`
    })));
  }, [user, traders]);

  if (!copyingTraders.length) return null;

  return (
    <div 
      className={`fixed bottom-4 left-4 bg-gray-800 rounded-lg shadow-lg transition-all duration-300 overflow-hidden ${
        expanded ? 'w-64' : 'w-auto'
      }`}
    >
      <div 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center p-3 cursor-pointer bg-blue-900 hover:bg-blue-800"
      >
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-white font-medium">
            Copying {copyingTraders.length} {copyingTraders.length === 1 ? 'Trader' : 'Traders'}
          </span>
        </div>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-5 w-5 text-white ml-2 transform transition-transform ${expanded ? 'rotate-180' : ''}`} 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>

      {expanded && (
        <div className="p-3">
          <div className="space-y-3">
            {copyingTraders.map((trader) => (
              <Link
                key={trader.id}
                href={`/traders/${trader.id}`}
                className="flex items-center p-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden mr-3">
                  <Image 
                    src={trader.avatar || '/avatars/default.jpg'} 
                    alt={trader.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-sm text-white">{trader.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CopyTradeStatus;