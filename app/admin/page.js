'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Settings, Users, Trophy, Plus, Save, Eye, EyeOff, ArrowLeft, Edit, Trash2, CheckCircle, RefreshCw } from 'lucide-react';
import dataManager from '../lib/data.js';

// DataManager loaded successfully

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('matches');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [adminToken, setAdminToken] = useState('');

  const [settings, setSettings] = useState({ currentWeek: 1, adminPassword: '1234', entryFee: 35 });
  const [matches, setMatches] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [pot, setPot] = useState({ totalAmount: 0, numOfPlayers: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  // מיון
  const [sortWeek, setSortWeek] = useState('score_desc'); // score_desc | score_asc | name_asc | name_desc
  const [sortAll, setSortAll] = useState('name_asc');     // name_asc | name_desc | joined_new | joined_old | hasguess_first
  const [cleanNewWeekMatches, setCleanNewWeekMatches] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      (async () => {
        await dataManager.syncFromServer();
        loadAdminData();
      })();
    }
  }, [isAuthenticated]);

  // טען טוקן ניהול מהדפדפן (אם מוגדר)
  useEffect(() => {
    const t = localStorage.getItem('toto-admin-token') || '';
    setAdminToken(t);
  }, []);

  const getAdminHeaders = () => ({ 'X-Action': 'admin', ...(adminToken ? { 'X-Admin-Token': adminToken } : {}) });
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const refreshAll = async () => {
    setIsRefreshing(true);
    try {
      await dataManager.syncFromServer();
      loadAdminData();
    } finally {
      // ריענון מלא כמו F5
      if (typeof window !== 'undefined') {
        window.location.reload();
      } else {
        router.refresh();
      }
    }
  }

  const resetLocalCache = async () => {
    if (!confirm('לאפס קאש מקומי ולמשוך מהשרת?')) return;
    try {
      localStorage.removeItem('toto-shlush-data');
      localStorage.removeItem('toto-current-name');
      showToast('הקאש המקומי אופס');
    } finally {
      if (typeof window !== 'undefined') window.location.reload();
    }
  }

  const deleteMatch = async (matchId) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את המשחק?')) {
      dataManager.deleteMatch(matchId);
      await dataManager.mergeAndSave?.({ headers: getAdminHeaders() });
      await dataManager.syncFromServer();
      const updatedMatches = dataManager.getMatches(settings.currentWeek);
      setMatches(updatedMatches);
      showToast('משחק נמחק');
    }
  };

  const clearAllMatches = async () => {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל המשחקים?')) {
      // suppressed console output
      
      // Clear all matches for current week
      dataManager.clearAllMatches(settings.currentWeek);
      
      // שמירה וסנכרון מול השרת כדי שהמחיקה תהיה קבועה
      await dataManager.mergeAndSave?.({ headers: getAdminHeaders() });
      await dataManager.syncFromServer();
      
      // Update UI state
      const updated = dataManager.getMatches(settings.currentWeek);
      setMatches(updated);
      
      // Also refresh all admin data to ensure everything is in sync
      loadAdminData();
      
      showToast('כל המשחקים נמחקו בהצלחה!');
    }
  };

  const loadAdminData = () => {
    setIsLoading(true);
    try {
      const currentSettings = dataManager.getSettings();
      const currentMatches = dataManager.getMatches();
      const currentParticipants = dataManager.getUsers();
      const currentLeaderboard = dataManager.getLeaderboard();
      const currentPot = dataManager.getPot();

      setSettings(currentSettings);
      setMatches(currentMatches);
      setParticipants(currentParticipants);
      setLeaderboard(currentLeaderboard);
      setPot(currentPot);
    } catch (error) {
      // suppressed console output
    }
    setIsLoading(false);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Check password
    if (password === '1234' || dataManager.authenticateAdmin(password)) {
      setIsAuthenticated(true);
    } else {
      alert('סיסמה שגויה! הסיסמה הנכונה היא: 1234');
    }
  };

  const formatTime = (t) => {
    if (!t) return '';
    const s = String(t).trim();
    if (s.includes(':')) return s; // already formatted
    // Expecting HHMM (e.g. 2030) or HMM (e.g. 930)
    const digits = s.replace(/\D/g, '');
    if (digits.length === 4) return `${digits.slice(0,2)}:${digits.slice(2)}`;
    if (digits.length === 3) return `0${digits[0]}:${digits.slice(1)}`;
    return s;
  };

  const formatDateForInput = (d) => {
    if (!d) return '';
    const s = String(d).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (s.includes('T')) return s.slice(0,10);
    const dt = new Date(s);
    return isNaN(dt) ? '' : dt.toISOString().slice(0,10);
  };

  const uploadJSON = async (jsonData) => {
    try {
      const parsedData = JSON.parse(jsonData);
      
      // מחיקת משחקים קיימים לשבוע הנוכחי
      dataManager.clearAllMatches(settings.currentWeek);
      
      // יצירת משחקים חדשים
      const newMatches = [];
      if (parsedData.rows && Array.isArray(parsedData.rows)) {
        parsedData.rows.forEach((row, index) => {
          const match = {
            week: settings.currentWeek,
            homeTeam: row.teamA || row.homeTeam || `קבוצה בית ${index + 1}`,
            awayTeam: row.teamB || row.awayTeam || `קבוצה חוץ ${index + 1}`,
            result: row.result || '',
            league: row.league || 'ליגה לאומית',
            time: formatTime(row.time) || (row.eventStartTime ? formatTime(String(row.eventStartTime).slice(11,16)) : '20:00'),
            day: row.day || 'שבת',
            date: row.eventStartTime ? String(row.eventStartTime).slice(0,10) : (row.date ? String(row.date).slice(0,10) : ''),
            category: 'טוטו 16'
          };
          const addedMatch = dataManager.addMatch(match);
          newMatches.push(addedMatch);
        });
      } else if (Array.isArray(parsedData)) {
        // אם הנתונים הם מערך ישיר
        parsedData.forEach((row, index) => {
          const match = {
            week: settings.currentWeek,
            homeTeam: row.teamA || row.homeTeam || `קבוצה בית ${index + 1}`,
            awayTeam: row.teamB || row.awayTeam || `קבוצה חוץ ${index + 1}`,
            result: row.result || '',
            league: row.league || 'ליגה לאומית',
            time: formatTime(row.time) || (row.eventStartTime ? formatTime(String(row.eventStartTime).slice(11,16)) : '20:00'),
            day: row.day || 'שבת',
            date: row.eventStartTime ? String(row.eventStartTime).slice(0,10) : (row.date ? String(row.date).slice(0,10) : ''),
            category: 'טוטו 16'
          };
          const addedMatch = dataManager.addMatch(match);
          newMatches.push(addedMatch);
        });
      }
      
      await dataManager.mergeAndSave?.({ headers: getAdminHeaders() });
      await dataManager.syncFromServer();
      setMatches(dataManager.getMatches(settings.currentWeek));
      showToast(`נטענו ${newMatches.length} משחקים`);
    } catch (error) {
      // suppressed console output
      showToast('שגיאה בטעינת הנתונים.', 'error');
    }
  };

  // פורמט להצגת תאריך ושעה
  const formatDateDisplay = (d) => {
    if (!d) return '';
    const s = String(d);
    const ymd = s.includes('T') ? s.slice(0,10) : s;
    const [y,m,da] = ymd.split('-');
    if (y && m && da) return `${da}.${m}.${y}`;
    const dt = new Date(s);
    if (isNaN(dt)) return '';
    return dt.toLocaleDateString('he-IL');
  };

  const updateMatchResult = (matchId, result) => {
    setMatches((prevMatches) => prevMatches.map((match) => (match.id === matchId ? { ...match, result } : match)));
  };

  const updateMatch = async (matchId, field, value) => {
    const updatedMatch = dataManager.updateMatch(matchId, { [field]: value });
    if (updatedMatch) {
      setMatches((prev) => prev.map((m) => (m.id === matchId ? updatedMatch : m)));
      if (field === 'result') {
        dataManager.calculateScores();
        setLeaderboard(dataManager.getLeaderboard());
      }
      // ודא ששמירה עולה לשרת מיד כדי שכל המכשירים יראו
      await (dataManager.mergeAndSave ? dataManager.mergeAndSave({ headers: getAdminHeaders(), preferLocalSettings: true }) : Promise.resolve());
    }
  };

  const updateSettings = (newSettings) => {
    dataManager.updateSettings(newSettings);
    setSettings({ ...settings, ...newSettings });
    if (newSettings.currentWeek && newSettings.currentWeek !== settings.currentWeek) {
      loadAdminData();
    }
  };

  const toggleLockSubmissions = async () => {
    const next = !settings.submissionsLocked;
    dataManager.updateSettings({ submissionsLocked: next });
    await (dataManager.mergeAndSave ? dataManager.mergeAndSave({ headers: getAdminHeaders(), preferLocalSettings: true }) : Promise.resolve());
    await dataManager.syncFromServer();
    setSettings({ ...settings, submissionsLocked: next });
    showToast(next ? 'הגשה ננעלה' : 'הגשה נפתחה');
  };

  // מעבר מהיר בין שבועות
  const applyWeekSwitch = async (newWeek) => {
    try {
      // שמור את השבוע הקודם כדי להחליט אם מדובר במעבר קדימה/אחורה
      const prevWeek = Number(settings.currentWeek || dataManager.getSettings().currentWeek || 1)
      // עדכן מיד את ה־UI לרספונסיביות
      setSettings((prev) => ({ ...prev, currentWeek: newWeek }))

      // ניקוי משחקים לשבוע היעד – אך ורק במעבר קדימה, ולא בעת חזרה לשבוע קודם
      if (cleanNewWeekMatches && newWeek > prevWeek) {
        const existing = dataManager.getMatches(newWeek) || []
        if (existing.length === 0 || confirm(`לנקות ${existing.length} משחקים קיימים לשבוע ${newWeek} לפני ייבוא?`)) {
          dataManager.clearAllMatches(newWeek);
        }
      }
      dataManager.updateSettings({ currentWeek: newWeek });
      await (dataManager.mergeAndSave ? dataManager.mergeAndSave({ headers: getAdminHeaders(), preferLocalSettings: true }) : Promise.resolve());
      await dataManager.syncFromServer();
      loadAdminData();
      showToast(`עברנו לשבוע ${newWeek}`);
      if (typeof window !== 'undefined') {
        setTimeout(()=>window.location.reload(), 200);
      }
    } catch (_) {
      showToast('שגיאה במעבר שבוע', 'error')
    }
  }

  const switchToNextWeek = async () => {
    const next = Number(settings.currentWeek || 1) + 1;
    if (!confirm(`לעבור לשבוע ${next}?${cleanNewWeekMatches ? '\n(משחקי השבוע החדש ינוקו לפני ייבוא)' : ''}`)) return;
    await applyWeekSwitch(next);
  }

  const switchToPrevWeek = async () => {
    const prev = Math.max(1, Number(settings.currentWeek || 1) - 1);
    if (prev === (settings.currentWeek||1)) return;
    if (!confirm(`לעבור לשבוע ${prev}?`)) return;
    await applyWeekSwitch(prev);
  }

  const switchToSpecificWeek = async () => {
    const input = prompt('הזן מספר שבוע יעד', String((Number(settings.currentWeek||1))+1));
    if (!input) return;
    const target = parseInt(input, 10);
    if (!Number.isFinite(target) || target < 1) { alert('מספר שבוע לא תקין'); return; }
    if (!confirm(`לעבור לשבוע ${target}?${cleanNewWeekMatches ? '\n(משחקי השבוע החדש ינוקו לפני ייבוא)' : ''}`)) return;
    await applyWeekSwitch(target);
  }

  const deleteGuessesForUserCurrentWeek = async (userIdOrName) => {
    if (confirm('למחוק את הניחוש של המשתתף לשבוע הנוכחי?')) {
      dataManager.deleteUserGuessesByUserAndWeek(userIdOrName, settings.currentWeek);
      await (dataManager.mergeAndSave ? dataManager.mergeAndSave({ headers: getAdminHeaders() }) : Promise.resolve());
      await dataManager.syncFromServer();
      // רענון מלא של נתוני האדמין כדי לשקף את המחיקה מיד
      dataManager.calculateScores();
      loadAdminData();
      showToast('ניחוש המשתתף לשבוע נמחק');
    }
  };

  const clearAllGuessesForCurrentWeek = async () => {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל הניחושים לשבוע הנוכחי?')) {
      dataManager.clearAllGuesses(settings.currentWeek);
      await (dataManager.mergeAndSave ? dataManager.mergeAndSave({ headers: getAdminHeaders() }) : Promise.resolve());
      await dataManager.syncFromServer();
      dataManager.calculateScores();
      loadAdminData();
      showToast('כל ניחושי השבוע נמחקו');
    }
  };

  const deleteGuessById = async (guessId) => {
    if (confirm('למחוק את הניחוש לשבוע הנוכחי?')) {
      dataManager.deleteUserGuess(guessId);
      await (dataManager.mergeAndSave ? dataManager.mergeAndSave({ headers: getAdminHeaders() }) : Promise.resolve());
      await dataManager.syncFromServer();
      dataManager.calculateScores();
      loadAdminData();
      showToast('הניחוש נמחק');
    }
  };

  const deleteUserCompletely = async (userIdOrName) => {
    if (confirm('למחוק משתמש לחלוטין כולל כל הניחושים? פעולה זו בלתי הפיכה.')) {
      const res = dataManager.deleteUser(userIdOrName);
      await (dataManager.mergeAndSave ? dataManager.mergeAndSave({ headers: getAdminHeaders() }) : Promise.resolve());
      await dataManager.syncFromServer();
      dataManager.calculateScores();
      loadAdminData();
      showToast(`נמחקו ${res.usersRemoved} משתמש/ים ו-${res.guessesRemoved} ניחושים.`);
    }
  };

  const createDefaultMatches = () => {
    const newMatches = dataManager.createDefaultMatches(settings.currentWeek);
    setMatches(newMatches);
    showToast(`${newMatches.length} משחקים נוצרו`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="absolute top-4 right-4">
          <button onClick={() => router.push('/')} className="btn btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> חזרה לדף הבית
          </button>
        </div>
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded text-white shadow ${toast.type==='success'?'bg-green-600':'bg-red-600'}`}>
            {toast.msg}
          </div>
        )}
        <div className="card max-w-md mx-auto">
          <div className="card-content">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-blue-800 mb-2">כניסת מנהל</h2>
              <p className="text-blue-600">הזן את סיסמת המנהל</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">סיסמת מנהל</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="הזן סיסמה"
                    className="input pl-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-3"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-blue-500" /> : <Eye className="w-4 h-4 text-blue-500" />}
                  </button>
                </div>
              </div>
              {false && (
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Admin API Token (רשות)</label>
                  <input
                    type="text"
                    value={adminToken}
                    onChange={(e) => setAdminToken(e.target.value)}
                    placeholder="X-Admin-Token"
                    className="input"
                  />
                  <button type="button" onClick={() => { localStorage.setItem('toto-admin-token', adminToken); showToast('Token נשמר'); }} className="btn btn-secondary mt-2">שמור Token</button>
                </div>
              )}
              <button type="submit" className="btn bg-blue-600 hover:bg-blue-700 text-white w-full py-3 text-lg font-bold">
                <Shield className="w-5 h-5 ml-2" /> כניסה
              </button>
            </form>
            {/* הסרת הצגת סיסמת ברירת מחדל */}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-blue-600 text-lg">טוען פאנל מנהל...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded text-white shadow ${toast.type==='success'?'bg-green-600':'bg-red-600'}`}>
            {toast.msg}
          </div>
        )}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-blue-800">פאנל מנהל</h1>
          </div>
          <p className="text-lg text-blue-600">ניהול משחקים, תוצאות ומשתתפים</p>
        </div>
        <div className="mb-6 flex items-center gap-2 flex-wrap">
          <button onClick={() => router.push('/')} className="btn btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> חזרה לדף הבית
          </button>
          <button onClick={refreshAll} disabled={isRefreshing} className="btn btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> {isRefreshing ? 'מרענן...' : 'רענן נתונים'}
          </button>
          <button onClick={resetLocalCache} className="btn btn-danger flex items-center gap-2">אפס קאש מקומי</button>
        </div>
        <div className="card mb-6">
          <div className="card-content p-0">
            <div className="flex flex-wrap border-b">
              {[
                { id: 'matches', label: 'משחקים', icon: Trophy },
                { id: 'results', label: 'תוצאות', icon: Users },
                { id: 'participants', label: 'משתתפים', icon: Users },
                { id: 'settings', label: 'הגדרות', icon: Settings },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-1/2 sm:flex-1 px-4 py-3 text-center font-medium transition-all flex flex-col items-center justify-center ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white border-b-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mb-1" />
                  <span className="text-sm truncate">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        {activeTab === 'matches' && (
          <div className="space-y-6">
            {/* העלאת JSON */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-bold text-blue-800">העלאת נתוני טוטו 16</h2>
                <p className="text-gray-600">העלה קובץ JSON עם נתוני המשחקים מ-Winner</p>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      העלה קובץ JSON או הדבק נתונים:
                    </label>
                    <textarea
                      className="input h-32"
                      placeholder="הדבק כאן את נתוני ה-JSON מ-Winner..."
                      onChange={(e) => {
                        if (e.target.value.trim()) {
                          uploadJSON(e.target.value);
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-4">
                    <button onClick={createDefaultMatches} className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                      <Plus className="w-4 h-4" /> יצירת 16 משחקים ברירת מחדל
                    </button>
                    {matches.length > 0 && (
                      <div className="flex gap-2">
                        <button onClick={clearAllMatches} className="btn btn-danger flex items-center gap-2">
                          <Trash2 className="w-4 h-4" /> מחק משחקי השבוע
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* רשימת משחקים */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-bold text-blue-800">משחקי שבוע {settings.currentWeek}</h2>
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
                      <div key={match.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-blue-800">משחק {index + 1}</h3>
                          <button
                            onClick={() => deleteMatch(match.id)}
                            className="text-red-500 hover:text-red-700"
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
                          {/* הסרת בחירת תוצאה במסך משחקים - ניהול תוצאות בלשונית ייעודית */}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'results' && (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-bold text-blue-800">תוצאות משחקים</h2>
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
                    {/* כרטיס חישוב ניקוד הוסתר – הניקוד מחושב אוטומטית */}
                    {false && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="font-bold text-yellow-800 mb-2">חישוב ניקוד</h3>
                        <p className="text-yellow-700 text-sm">
                          לאחר הזנת כל התוצאות, הניקוד יחושב אוטומטית לכל המשתתפים
                        </p>
                        <button 
                          onClick={() => {
                            dataManager.calculateScores();
                            setLeaderboard(dataManager.getLeaderboard());
                            showToast('ניקוד חושב בהצלחה!');
                          }}
                          className="btn btn-primary mt-2"
                        >
                          חשב ניקוד עכשיו
                        </button>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {matches.map((match, index) => (
                        <div key={match.id} className="border rounded-lg p-4 bg-gray-50">
                          <h3 className="font-bold text-blue-800 mb-2">משחק {index + 1}</h3>
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
                            { (match.league) ? <span className="block mt-1 text-gray-500">{match.league}</span> : null }
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
        )}
        {activeTab === 'participants' && (() => {
          const guessesThisWeek = dataManager.getUserGuesses(settings.currentWeek);
          const participantsWithGuess = guessesThisWeek.map(g => ({
            guess: g,
            user: participants.find(p => p.id === g.userId) || { id: g.userId, name: g.name, phone: g.phone, createdAt: g.createdAt }
          }));
          const byUserId = new Map(guessesThisWeek.map(g => [g.userId, g]))
          const scoreById = new Map(leaderboard.map(l => [l.userId, l.score]))
          const scoreByName = new Map(leaderboard.map(l => [String(l.name||'').toLowerCase().trim(), l.score]))
          const getScore = (u) => (scoreById.get(u.id) ?? scoreByName.get(String(u.name||'').toLowerCase().trim()) ?? 0)

          const sortedWeek = [...participantsWithGuess].sort((a,b) => {
            const sa = getScore(a.user), sb = getScore(b.user)
            const na = String(a.user.name||'').toLowerCase(), nb = String(b.user.name||'').toLowerCase()
            switch (sortWeek) {
              case 'score_asc': return sa - sb || na.localeCompare(nb)
              case 'name_asc': return na.localeCompare(nb)
              case 'name_desc': return nb.localeCompare(na)
              case 'score_desc':
              default: return sb - sa || na.localeCompare(nb)
            }
          })

          const sortedAll = [...participants].sort((a,b) => {
            const hasA = byUserId.has(a.id), hasB = byUserId.has(b.id)
            const na = String(a.name||'').toLowerCase(), nb = String(b.name||'').toLowerCase()
            const ta = new Date(a.createdAt||0).getTime(), tb = new Date(b.createdAt||0).getTime()
            switch (sortAll) {
              case 'name_desc': return nb.localeCompare(na)
              case 'joined_new': return tb - ta
              case 'joined_old': return ta - tb
              case 'hasguess_first': return (hasB?1:0) - (hasA?1:0) || nb.localeCompare(na)
              case 'name_asc':
              default: return na.localeCompare(nb)
            }
          })
          return (
          <div className="space-y-6">
            {/* טבלת דירוג לשבוע הנוכחי (כמו היום) */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-bold text-blue-800">משתתפים — שבוע {settings.currentWeek}</h2>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-gray-600">{participantsWithGuess.length} משתתפים עם ניחוש לשבוע זה</p>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">מיין לפי:</label>
                    <select value={sortWeek} onChange={(e)=>setSortWeek(e.target.value)} className="input w-44 text-sm">
                      <option value="score_desc">ניקוד (גבוה→נמוך)</option>
                      <option value="score_asc">ניקוד (נמוך→גבוה)</option>
                      <option value="name_asc">שם (א׳→ת׳)</option>
                      <option value="name_desc">שם (ת׳→א׳)</option>
                    </select>
                  </div>
                  <button onClick={clearAllGuessesForCurrentWeek} className="btn btn-danger flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> מחק את כל ניחושי השבוע
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
                  <div className="space-y-4">
                    {sortedWeek.map(({ user, guess }) => (
                      <div key={guess.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-blue-800">{user.name}</h3>
                            <p className="text-sm text-gray-500">
                              הצטרף: {new Date(user.createdAt).toLocaleDateString('he-IL')}
                            </p>
                            <div className="mt-2 text-xs text-blue-600">ניחוש קיים לשבוע {settings.currentWeek}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">{getScore(user)}</div>
                            <div className="text-sm text-gray-500">נקודות</div>
                            <div className="flex flex-col gap-2 mt-2">
                              <button onClick={() => deleteGuessById(guess.id)} className="btn btn-danger flex items-center gap-2">
                                <Trash2 className="w-4 h-4" /> מחק ניחוש לשבוע
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* כל המשתמשים אי פעם במערכת */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-bold text-blue-800">כל המשתמשים</h2>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-gray-600">סה"כ {participants.length} משתמשים</p>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">מיין לפי:</label>
                    <select value={sortAll} onChange={(e)=>setSortAll(e.target.value)} className="input w-64 text-sm">
                      <option value="name_asc">שם (א׳→ת׳)</option>
                      <option value="name_desc">שם (ת׳→א׳)</option>
                      <option value="joined_new">תאריך הצטרפות (חדש→ישן)</option>
                      <option value="joined_old">תאריך הצטרפות (ישן→חדש)</option>
                      <option value="hasguess_first">יש ניחוש לשבוע (תחילה)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="card-content">
                {participants.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">אין משתמשים רשומים</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedAll.map((u) => {
                      const g = byUserId.get(u.id)
                      const score = getScore(u)
                      return (
                        <div key={u.id} className="flex items-center justify-between border rounded-lg p-3 bg-white">
                          <div>
                            <div className="font-bold text-blue-800">{u.name}</div>
                            <div className="text-xs text-gray-500">הצטרף: {new Date(u.createdAt).toLocaleDateString('he-IL')}</div>
                            {g ? (
                              <div className="text-xs text-green-700 mt-1">יש ניחוש לשבוע {settings.currentWeek}</div>
                            ) : (
                              <div className="text-xs text-gray-500 mt-1">אין ניחוש לשבוע {settings.currentWeek}</div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">ניקוד שבועי</div>
                            <div className="text-lg font-bold text-blue-600 text-right">{score || 0}</div>
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => deleteUserCompletely(u.id)} className="btn btn-danger flex items-center gap-2">
                                <Trash2 className="w-4 h-4" /> מחק משתמש
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          );
        })()}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-bold text-blue-800">הגדרות מערכת</h2>
                <p className="text-gray-600">ניהול הגדרות האפליקציה</p>
              </div>
              <div className="card-content">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      שבוע נוכחי
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="number"
                        value={settings.currentWeek}
                        onChange={(e) => updateSettings({ currentWeek: parseInt(e.target.value) })}
                        className="input w-32"
                        min="1"
                      />
                      <button onClick={switchToPrevWeek} className="btn btn-secondary">‹ שבוע קודם</button>
                      <button onClick={switchToNextWeek} className="btn btn-secondary">שבוע הבא ›</button>
                      <button onClick={switchToSpecificWeek} className="btn btn-primary">מעבר לשבוע...</button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <input id="cleanNewW" type="checkbox" checked={cleanNewWeekMatches} onChange={(e)=>setCleanNewWeekMatches(e.target.checked)} />
                      <label htmlFor="cleanNewW" className="text-sm text-gray-600">נקה משחקים לשבוע היעד לפני ייבוא (רק במעבר קדימה)</label>
                    </div>
                  </div>
                  
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
                      <div className="text-sm text-gray-600">{settings.submissionsLocked ? 'סגור — אי אפשר לשלוח טפסים' : 'פתוח — ניתן לשלוח טפסים'}</div>
                    </div>
                    <button onClick={toggleLockSubmissions} className={`btn ${settings.submissionsLocked ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'btn-secondary'}`}>
                      {settings.submissionsLocked ? 'פתח הגשה' : 'נעל הגשה'}
                    </button>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-bold text-blue-800 mb-2">סטטיסטיקות</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
