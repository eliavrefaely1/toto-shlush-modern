'use client';

import Link from 'next/link';
import { Target, Star } from 'lucide-react';

const ActionButtons = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <Link href="/guess" className="group">
        <div className="card hover:shadow-xl transition-all duration-300 group-hover:scale-105">
          <div className="card-content text-center">
            <Target className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-blue-800 mb-2">מלא טופס</h3>
            <p className="text-gray-600 mb-4">הזן את הניחושים שלך ל-16 המשחקים</p>
            <div className="btn btn-primary w-full text-lg py-3">
              התחל לנחש! 🎯
            </div>
          </div>
        </div>
      </Link>

      <Link href="/leaderboard" className="group">
        <div className="card hover:shadow-xl transition-all duration-300 group-hover:scale-105">
          <div className="card-content text-center">
            <Star className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-blue-800 mb-2">טבלת דירוג</h3>
            <p className="text-gray-600 mb-4">ראה מי מוביל בתחרות</p>
            <div className="btn btn-secondary w-full text-lg py-3">
              צפה בדירוג! 🏆
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ActionButtons;
