'use client';

import { Users } from 'lucide-react';

const LeaderboardTable = ({ 
  leaderboard, 
  topScore, 
  expanded, 
  toggleExpanded, 
  matchesForWeek 
}) => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-xl font-bold text-blue-800 flex items-center gap-2">
          <Users className="w-6 h-6" />
          טבלת המחזור
        </h3>
      </div>
      <div className="card-content">
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <div key={entry.id}>
              <div className={`flex items-center justify-between p-2 rounded-md ${
                topScore !== null && entry.score === topScore ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white ${
                    (topScore !== null && entry.score === topScore) ? 'bg-green-600' :
                    index === 1 ? 'bg-blue-500' :
                    index === 2 ? 'bg-blue-400' :
                    'bg-blue-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-bold text-sm flex items-center gap-2">
                      {entry.user?.name || entry.name}
                      {/* חיווי תשלום */}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        (entry.paymentStatus || 'unpaid') === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {(entry.paymentStatus || 'unpaid') === 'paid' ? '✓ שולם' : '✗ לא שולם'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">{entry.user?.phone || entry.phone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">{entry.score}</div>
                    <div className="text-xs text-gray-500">נקודות</div>
                  </div>
                  <button
                    className="btn btn-secondary text-sm"
                    onClick={() => toggleExpanded(entry.id)}
                  >
                    {expanded[entry.id] ? 'הסתר ניחושים' : 'הצג ניחושים'}
                  </button>
                </div>
              </div>
              {expanded[entry.id] && (
                <div className="mt-2 bg-gray-50 rounded-lg p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(matchesForWeek || []).map((m, i) => {
                      const guess = entry.guesses?.[i] || '';
                      const hasResult = !!m.result;
                      const correct = hasResult && !!guess && m.result === guess;
                      const wrong = hasResult && !!guess && m.result !== guess;
                      const boxClasses = `p-2 rounded border ${
                        correct ? 'bg-green-50 border-green-200' :
                        wrong ? 'bg-red-50 border-red-200' :
                        'bg-white border-gray-200'
                      }`;
                      const guessColor = correct ? 'text-green-700' : (wrong ? 'text-red-700' : 'text-gray-800');
                      return (
                        <div key={`${entry.id}_${i}`} className={boxClasses}>
                          <div className="text-xs text-gray-500 mb-1">משחק {i + 1}</div>
                          <div className="text-sm font-medium text-gray-800">{m.homeTeam} vs {m.awayTeam}</div>
                          <div className="text-sm mt-1">
                            ניחוש: <span className={`font-bold ${guessColor}`}>{guess || '?'}</span>
                            {m.result ? (
                              <span className="text-gray-500"> · תוצאה: <span className="font-bold">{m.result}</span></span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardTable;
