'use client';

import { Plus, Trash2, Trophy, CheckCircle } from 'lucide-react';

const MatchesTab = ({ 
  matches, 
  uploadJSON, 
  createDefaultMatches, 
  clearAllMatches, 
  updateMatch, 
  deleteMatch, 
  formatDateForInput,
  formatDateDisplay
}) => {
  return (
    <div className="space-y-6">
      {/* העלאת JSON */}
      <div className="card shadow-lg">
        <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100">
          <h2 className="text-xl font-bold text-blue-800">העלאת נתוני טוטו 16</h2>
          <p className="text-gray-600">העלה נתונים מ-Winner16 או צור משחקים ברירת מחדל</p>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            <div>
              <label className="block text-md font-medium text-gray-700 mb-2">
                הדבק נתונים:
              </label>
              <textarea
                className="input h-32"
                placeholder="Winner16 --> inspect --> network --> GetTotoDraws --> GamType96"
                onChange={(e) => {
                  if (e.target.value.trim()) {
                    uploadJSON(e.target.value);
                  }
                }}
              />
            </div>
            <div className="flex gap-4">
              <button 
                onClick={createDefaultMatches} 
                className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> יצירת 16 משחקים ברירת מחדל
              </button>
              {matches.length > 0 && (
                <div className="flex gap-2">
                  <button 
                    onClick={clearAllMatches} 
                    className="btn btn-danger flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> מחק משחקי השבוע
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* רשימת משחקים */}
      <div className="card shadow-lg">
        <div className="card-header bg-gradient-to-r from-green-50 to-green-100">
          <h2 className="text-xl font-bold text-green-800">משחקים</h2>
          <p className="text-gray-600">{matches.length} משחקים</p>
        </div>
        <div className="card-content">
          {matches.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">אין משחקים זמינים</p>
              <p className="text-gray-400">העלה נתונים או צור משחקים ברירת מחדל</p>
            </div>
          ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {matches.map((match, index) => (
                      <div key={match.id} className="border rounded-lg p-4 bg-gradient-to-br from-gray-50 to-gray-100 shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-blue-800 text-lg">משחק {index + 1}</h3>
                          <button
                            onClick={() => deleteMatch(match.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-gray-600">קבוצה בית:</label>
                      <input
                        type="text"
                        value={match.homeTeam || ''}
                        onChange={(e) => updateMatch(match.id, 'homeTeam', e.target.value)}
                        className="input text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">קבוצה חוץ:</label>
                      <input
                        type="text"
                        value={match.awayTeam || ''}
                        onChange={(e) => updateMatch(match.id, 'awayTeam', e.target.value)}
                        className="input text-sm"
                      />
                    </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div>
                              <label className="text-sm text-gray-600">יום:</label>
                              <input
                                type="text"
                                value={match.day || ''}
                                onChange={(e) => updateMatch(match.id, 'day', e.target.value)}
                                className="input text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-gray-600">שעה:</label>
                              <input
                                type="text"
                                value={match.time || ''}
                                onChange={(e) => updateMatch(match.id, 'time', e.target.value)}
                                className="input text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-gray-600">תאריך:</label>
                              <input
                                type="date"
                                value={formatDateForInput(match.date)}
                                onChange={(e) => updateMatch(match.id, 'date', e.target.value)}
                                className="input text-sm"
                              />
                            </div>
                          </div>
                          
                          {/* שדה תוצאה */}
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
                            {match.result && (
                              <div className="flex items-center gap-2 text-green-600 mt-2">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm">תוצאה: {match.result}</span>
                              </div>
                            )}
                          </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default MatchesTab;
