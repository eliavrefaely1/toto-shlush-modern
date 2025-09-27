'use client';

import { Users } from 'lucide-react';
import Link from 'next/link';

const LeaderboardPreview = ({ leaderboard, topScore }) => {
  if (leaderboard.length === 0) return null;

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-xl font-bold text-blue-800 flex items-center gap-2">
          <Users className="w-6 h-6" />
          מובילי המחזור
        </h3>
      </div>
      <div className="card-content">
        <div className="space-y-3">
          {leaderboard.slice(0, 5).map((entry, index) => {
            const isTop = topScore !== null && entry.score === topScore
            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-2 rounded-md ${
                  isTop ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white ${
                    isTop ? 'bg-green-600' :
                    index === 1 ? 'bg-blue-500' :
                    index === 2 ? 'bg-blue-400' :
                    'bg-blue-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{entry.user?.name || entry.name}</div>
                    <div className="text-xs text-gray-500">{entry.user?.phone || entry.phone}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{entry.score}</div>
                  <div className="text-xs text-gray-500">נקודות</div>
                </div>
              </div>
            );
          })}
        </div>
        
        {leaderboard.length > 5 && (
          <div className="text-center mt-4">
            <Link href="/leaderboard" className="btn btn-secondary">
              צפה בכל הדירוג
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPreview;
