'use client';

import { Trophy, RefreshCw } from 'lucide-react';

const HomeHeader = ({ isRefreshing, refreshData }) => {
  return (
    <header className="bg-white/80 backdrop-blur border-b border-gray-200 shadow-md rounded-lg mb-6">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-blue-800">טוטו שלוש</h1>
              <p className="text-base text-gray-600">המקום לזכות בגדול</p>
            </div>
          </div>
          <nav className="flex gap-3">
            <button 
              onClick={refreshData} 
              disabled={isRefreshing} 
              className="btn btn-primary flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'מרענן...' : 'רענן'}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default HomeHeader;
