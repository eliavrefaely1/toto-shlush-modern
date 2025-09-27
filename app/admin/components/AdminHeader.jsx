'use client';

import { Shield, ArrowLeft, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

const AdminHeader = ({ 
  isRefreshing, 
  refreshAll
}) => {
  const router = useRouter();

  return (
    <>
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-blue-800">פאנל מנהל</h1>
        </div>
        <p className="text-lg text-blue-600">ניהול משחקים, תוצאות ומשתתפים</p>
      </div>
      
      <div className="mb-6 flex items-center gap-3 flex-wrap justify-center">
        <button 
          onClick={() => router.push('/')} 
          className="btn btn-secondary flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
        >
          <ArrowLeft className="w-4 h-4" /> חזרה לדף הבית
        </button>
        
        <button 
          onClick={refreshAll} 
          disabled={isRefreshing} 
          className="btn btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-shadow"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> 
          {isRefreshing ? 'מרענן...' : 'רענן נתונים'}
        </button>
      </div>
    </>
  );
};

export default AdminHeader;
