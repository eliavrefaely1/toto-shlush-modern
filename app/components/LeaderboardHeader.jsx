'use client';

import { Trophy, RefreshCw } from 'lucide-react';

const LeaderboardHeader = ({ isRefreshing, refreshNow, exportGuessesPNG }) => {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-3 mb-4">
        <Trophy className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-blue-800">טבלת דירוג</h1>
      </div>
      
      {/* כפתורי פעולה */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button 
          onClick={refreshNow} 
          disabled={isRefreshing} 
          className="btn btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'מרענן...' : 'רענן'}
        </button>
        <button onClick={exportGuessesPNG} className="btn btn-primary flex items-center gap-2">
          ייצוא תמונה (PNG)
        </button>
      </div>
    </div>
  );
};

export default LeaderboardHeader;
