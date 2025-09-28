'use client';

const SettingsTab = ({ 
  settings, 
  updateSettings, 
  debouncedUpdateSettings, 
  toggleLockSubmissions, 
  tempAdminEmail, 
  setTempAdminEmail, 
  matches, 
  leaderboard, 
  pot, 
  countdownActiveLocal, 
  setCountdownActiveLocal, 
  countdownDate, 
  setCountdownDate, 
  countdownTime, 
  setCountdownTime, 
  getAdminHeaders, 
  loadAdminData, 
  showToast 
}) => {
  return (
    <div className="space-y-6">
      <div className="card shadow-lg">
        <div className="card-header bg-gradient-to-r from-teal-50 to-teal-100">
          <h2 className="text-xl font-bold text-teal-800">הגדרות מערכת</h2>
          <p className="text-gray-600">ניהול הגדרות האפליקציה</p>
        </div>
        <div className="card-content">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                דמי השתתפות (₪)
              </label>
              <input
                type="number"
                value={settings.entryFee}
                onChange={(e) => updateSettings({ entryFee: parseInt(e.target.value) })}
                className="input"
                min="1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                פרס ראשון בטוטו (₪)
              </label>
              <input
                type="number"
                value={settings.totoFirstPrize || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                  debouncedUpdateSettings({ totoFirstPrize: value });
                }}
                className="input"
                min="1"
                placeholder="8000000"
              />
            </div>

            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סיסמת מנהל
              </label>
              <input
                type="text"
                value={settings.adminPassword}
                onChange={(e) => updateSettings({ adminPassword: e.target.value })}
                className="input"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div>
                <div className="font-bold text-blue-800">מצב הגשת טפסים</div>
                <div className="text-sm text-gray-600">
                  {settings.submissionsLocked ? 'סגור — אי אפשר לשלוח טפסים' : 'פתוח — ניתן לשלוח טפסים'}
                </div>
              </div>
              <button 
                onClick={toggleLockSubmissions} 
                className={`btn ${settings.submissionsLocked ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'btn-secondary'}`}
              >
                {settings.submissionsLocked ? 'פתח הגשה' : 'נעל הגשה'}
              </button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-blue-800 mb-2">סטטיסטיקות</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">משחקים:</span>
                  <span className="font-bold text-blue-600 ml-2">{matches.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">משתתפים:</span>
                  <span className="font-bold text-blue-600 ml-2">{leaderboard.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">קופה:</span>
                  <span className="font-bold text-blue-600 ml-2">₪{pot.totalAmount}</span>
                </div>
                <div>
                  <span className="text-gray-600">דמי השתתפות:</span>
                  <span className="font-bold text-blue-600 ml-2">₪{pot.amountPerPlayer}</span>
                </div>
                <div className="col-span-2">
                  <div className="text-red-600 font-bold text-sm">פרס ראשון בטוטו</div>
                  <div className="text-red-600 font-bold text-lg">₪{(settings.totoFirstPrize || 8000000).toLocaleString()}</div>
                  <div className="text-gray-600 text-sm">{pot.numOfPlayers} משתתפים</div>
                  <div className="text-gray-600 text-sm">
                    ₪{pot.numOfPlayers > 0 ? ((settings.totoFirstPrize || 8000000) / pot.numOfPlayers).toLocaleString('he-IL', { maximumFractionDigits: 2 }) : '0'} למשתתף
                  </div>
                </div>
              </div>
            </div>

            {/* הגדרת שעון רץ */}
            <div className="bg-gray-50 border rounded-lg p-4">
              <h3 className="font-bold text-blue-800 mb-2">שעון רץ</h3>
              <div className="flex items-center gap-2 mb-3">
                <input 
                  id="cdActive" 
                  type="checkbox" 
                  checked={countdownActiveLocal} 
                  onChange={(e) => setCountdownActiveLocal(e.target.checked)} 
                />
                <label htmlFor="cdActive" className="text-sm text-gray-700">הפעל שעון רץ</label>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <input 
                  type="date" 
                  value={countdownDate} 
                  onChange={(e) => setCountdownDate(e.target.value)} 
                  className="input w-40" 
                />
                <input 
                  type="time" 
                  value={countdownTime} 
                  onChange={(e) => setCountdownTime(e.target.value)} 
                  className="input w-32" 
                />
                <button 
                  onClick={async () => {
                    const target = (countdownDate && countdownTime) ? `${countdownDate}T${countdownTime}` : '';
                    if (countdownActiveLocal && !target) { 
                      showToast('יש להזין תאריך ושעה ליעד', 'error'); 
                      return; 
                    }
                    updateSettings({ countdownActive: !!(countdownActiveLocal && target), countdownTarget: target });
                    await loadAdminData();
                    loadAdminData();
                    showToast('הגדרות שעון נשמרו');
                  }} 
                  className="btn btn-secondary"
                >
                  שמור
                </button>
              </div>
              {countdownActiveLocal && countdownDate && countdownTime && (
                <div className="text-sm text-gray-600 mt-2">יעד: {countdownDate} {countdownTime}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
