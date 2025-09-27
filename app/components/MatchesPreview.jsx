'use client';

import { Calendar, CheckCircle } from 'lucide-react';

const MatchesPreview = ({ matchesByDay }) => {
  if (Object.keys(matchesByDay).length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-xl font-bold text-blue-800 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            משחקי השבוע
          </h3>
        </div>
        <div className="card-content">
          <div className="text-center text-gray-500 py-8">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">אין משחקים מוגדרים לשבוע זה</p>
            <p className="text-sm mt-2">המנהל עדיין לא העלה את המשחקים</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-xl font-bold text-blue-800 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          משחקי השבוע
        </h3>
      </div>
      <div className="card-content">
        <div className="space-y-4">
          {Object.entries(matchesByDay).map(([dayName, dayMatches]) => (
            <div key={dayName} className="space-y-2">
              <h4 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-1">
                יום {dayName} ({dayMatches.length} משחקים):
              </h4>
              <div className="space-y-2">
                {dayMatches.map((match, index) => (
                  <div key={match.id || index} className={`flex items-center justify-between p-3 rounded-lg ${
                    match.result ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                  }`}>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 flex items-center gap-2">
                        {match.result && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {match.homeTeam} vs {match.awayTeam}
                      </div>
                      {match.result && (
                        <div className="text-sm text-green-600 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          תוצאה: {match.result === '1' ? '1' : match.result === 'X' ? 'X' : '2'}
                        </div>
                      )}
                      {!match.result && (
                        <div className="text-sm text-gray-500">
                          עדיין לא נקבעה תוצאה
                        </div>
                      )}
                    </div>
                    <div className="text-left text-sm text-gray-600">
                      {match.time && (
                        <div className="font-medium">{match.time}</div>
                      )}
                      {match.date && (
                        <div className="text-xs">
                          {new Date(match.date).toLocaleDateString('he-IL', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric' 
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MatchesPreview;
