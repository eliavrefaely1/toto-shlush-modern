'use client';

import { Users, Trash2, Edit } from 'lucide-react';

const ParticipantsTab = ({ 
  participantsWithGuess, 
  sortWeek, 
  setSortWeek, 
  clearAllGuessesForCurrentWeek, 
  settings, 
  updatePaymentStatus, 
  handleEditGuessClick, 
  deleteGuessById, 
  getScore 
}) => {
  return (
    <div className="space-y-6">
      <div className="card shadow-lg">
        <div className="card-header bg-gradient-to-r from-orange-50 to-orange-100">
          <h2 className="text-xl font-bold text-orange-800">משתתפים</h2>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-gray-600">{participantsWithGuess.length} משתתפים עם ניחוש</p>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">מיין לפי:</label>
              <select 
                value={sortWeek} 
                onChange={(e) => setSortWeek(e.target.value)} 
                className="input w-44 text-sm"
              >
                <option value="score_desc">ניקוד (גבוה→נמוך)</option>
                <option value="score_asc">ניקוד (נמוך→גבוה)</option>
                <option value="name_asc">שם (א׳→ת׳)</option>
                <option value="name_desc">שם (ת׳→א׳)</option>
              </select>
            </div>
            <button 
              onClick={clearAllGuessesForCurrentWeek} 
              className="btn btn-danger flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> מחק את כל הניחושים
            </button>
          </div>
        </div>
        <div className="card-content">
          {participantsWithGuess.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">אין ניחושים לשבוע הנוכחי</p>
            </div>
          ) : (
            <>
              {/* סיכום תשלומים */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-bold text-gray-800 mb-3">סיכום תשלומים</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {participantsWithGuess.filter(({ guess }) => (guess.paymentStatus || 'unpaid') === 'paid').length}
                    </div>
                    <div className="text-sm text-gray-600">שילמו</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {participantsWithGuess.filter(({ guess }) => (guess.paymentStatus || 'unpaid') === 'unpaid').length}
                    </div>
                    <div className="text-sm text-gray-600">לא שילמו</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      ₪{participantsWithGuess.filter(({ guess }) => (guess.paymentStatus || 'unpaid') === 'paid').length * settings.entryFee}
                    </div>
                    <div className="text-sm text-gray-600">סכום שנאסף</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {participantsWithGuess.map(({ user, guess }) => (
                  <div key={`participant-${guess.id}`} className="border rounded-lg p-4 bg-gradient-to-br from-gray-50 to-gray-100 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-orange-800 text-lg">{user.name}</h3>
                        <p className="text-sm text-gray-500">
                          הצטרף: {new Date(user.createdAt).toLocaleDateString('he-IL')}
                        </p>
                        <div className="mt-2 text-xs text-blue-600">ניחוש קיים</div>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* צ'ק בוקס תשלום */}
                        <div className="flex flex-col items-center">
                          <label className="text-xs text-gray-500 mb-1">תשלום</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={(guess.paymentStatus || 'unpaid') === 'paid'}
                              onChange={(e) => updatePaymentStatus(guess.id, e.target.checked ? 'paid' : 'unpaid')}
                              className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                            />
                            <span className={`text-xs font-medium ${(guess.paymentStatus || 'unpaid') === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                              {(guess.paymentStatus || 'unpaid') === 'paid' ? 'שולם' : 'לא שולם'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{getScore(user)}</div>
                          <div className="text-sm text-gray-500">נקודות</div>
                          <div className="flex flex-col gap-2 mt-2">
                            <button 
                              onClick={() => handleEditGuessClick(user, guess)} 
                              disabled={settings.submissionsLocked}
                              className={`btn btn-primary flex items-center gap-2 ${settings.submissionsLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={settings.submissionsLocked ? 'לא ניתן לערוך כאשר ההגשה נעולה' : ''}
                            >
                              <Edit className="w-4 h-4" /> ערוך ניחוש
                            </button>
                            <button 
                              onClick={() => deleteGuessById(guess.id)} 
                              className="btn btn-danger flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" /> מחק ניחוש
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParticipantsTab;
