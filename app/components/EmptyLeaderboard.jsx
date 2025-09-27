'use client';

import { Target } from 'lucide-react';
import Link from 'next/link';

const EmptyLeaderboard = () => {
  return (
    <div className="card text-center py-16">
      <div className="card-content">
        <Target className="w-20 h-20 text-gray-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-600 mb-2">אין משתתפים עדיין</h3>
        <p className="text-gray-500 mb-6">היה הראשון להצטרף לתחרות!</p>
        <Link href="/guess" className="btn btn-primary text-lg py-3 px-6">
          מלא טופס עכשיו! 🎯
        </Link>
      </div>
    </div>
  );
};

export default EmptyLeaderboard;
