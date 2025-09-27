'use client';

import { Trophy, CheckCircle } from 'lucide-react';

const ResultsTab = ({ matches, updateMatch, formatDateDisplay }) => {
  return (
    <div className="space-y-6">
      <div className="card shadow-lg">
        <div className="card-header bg-gradient-to-r from-purple-50 to-purple-100">
          <h2 className="text-xl font-bold text-purple-800">תוצאות משחקים</h2>
          <p className="text-gray-600">ניהול תוצאות המשחקים וחישוב ניקוד</p>
        </div>
        <div className="card-content">
          {matches.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">אין משחקים להצגת תוצאות</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map((match, index) => (
                  <div key={match.id} className="border rounded-lg p-4 bg-gradient-to-br from-gray-50 to-gray-100 shadow-md hover:shadow-lg transition-shadow">
                    <h3 className="font-bold text-purple-800 mb-3 text-lg">משחק {index + 1}</h3>
                    <div className="text-center mb-3">
                      <div className="text-lg font-bold">
                        {match.homeTeam} vs {match.awayTeam}
                      </div>
                    </div>
                    <div className="text-center text-xs text-gray-600 mb-3">
                      {match.day ? <span>יום {match.day}</span> : null}
                      {match.day ? <span> • </span> : null}
                      {match.date ? <span>{formatDateDisplay(match.date)}</span> : null}
                      {(match.date || match.day) && match.time ? <span> • </span> : null}
                      {match.time ? <span>{match.time}</span> : null}
                      {match.league ? <span className="block mt-1 text-gray-500">{match.league}</span> : null}
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">תוצאה:</label>
                      <select
                        value={match.result || ''}
                        onChange={(e) => updateMatch(match.id, 'result', e.target.value)}
                        className="input text-sm w-full"
                      >
                        <option value="">בחר תוצאה</option>
                        <option value="1">1 (בית)</option>
                        <option value="X">X (תיקו)</option>
                        <option value="2">2 (חוץ)</option>
                      </select>
                    </div>
                    {match.result && (
                      <div className="flex items-center gap-2 text-blue-600 mt-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">תוצאה: {match.result}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsTab;
