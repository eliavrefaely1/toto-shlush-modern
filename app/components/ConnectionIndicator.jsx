'use client';

import { useWebSocket } from '../../src/hooks/useWebSocket';
import { Wifi, WifiOff } from 'lucide-react';

/**
 * Minimal connection indicator - just shows connected/disconnected status
 */
const ConnectionIndicator = () => {
  const { connectionState, isConnected } = useWebSocket({
    autoConnect: true
  });

  return (
    <div className="flex items-center gap-1 text-sm">
      {isConnected ? (
        <>
          <Wifi className="w-4 h-4 text-green-600" />
          <span className="text-green-600">מחובר</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400">מנותק</span>
        </>
      )}
    </div>
  );
};

export default ConnectionIndicator;
