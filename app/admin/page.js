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

  const [settings, setSettings] = useState({ currentWeek: 1, adminPassword: '1234', entryFee: 35, totoFirstPrize: 8000000, submissionsLocked: false });
  const [matches, setMatches] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [pot, setPot] = useState({ totalAmount: 0, numOfPlayers: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  // מיון
  const [sortWeek, setSortWeek] = useState('score_desc'); // score_desc | score_asc | name_asc | name_desc
  const [sortAll, setSortAll] = useState('name_asc');     // name_asc | name_desc | joined_new | joined_old | hasguess_first
  const [cleanNewWeekMatches, setCleanNewWeekMatches] = useState(true);
  const [countdownActiveLocal, setCountdownActiveLocal] = useState(false);
  const [countdownDate, setCountdownDate] = useState('');
  const [countdownTime, setCountdownTime] = useState('');
  const [updateTimeout, setUpdateTimeout] = useState(null);
  // מודל שינוי שם
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameUser, setRenameUser] = useState(null);
  const [newUserName, setNewUserName] = useState('');
  
  // מודל עריכת ניחוש
  const [showEditGuessModal, setShowEditGuessModal] = useState(false);
  const [editGuessUser, setEditGuessUser] = useState(null);
  const [editGuessData, setEditGuessData] = useState(null);
  const [tempGuesses, setTempGuesses] = useState(Array(16).fill(''));

  useEffect(() => {
    if (isAuthenticated) {
      (async () => {
        await dataManager.initialize();
        loadAdminData();
      })();
    }
  }, [isAuthenticated]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [updateTimeout]);

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
      await dataManager.initialize();
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
      // אין יותר localStorage - רק רענון מהשרת
      showToast('מרענן נתונים מהשרת');
      await dataManager.initialize();
      loadAdminData();
    } finally {
      if (typeof window !== 'undefined') window.location.reload();
    }
  }


  const deleteMatch = async (matchId) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את המשחק?')) {
      await dataManager.deleteMatch(matchId);
      await dataManager.initialize();
      const updatedMatches = dataManager.getMatches(settings.currentWeek);
      setMatches(updatedMatches);
      showToast('משחק נמחק');
    }
  };

  const clearAllMatches = async () => {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל המשחקים?')) {
      // Clear all matches for current week
      await dataManager.clearAllMatches(settings.currentWeek);
      
      // Update UI state
      const updated = dataManager.getMatches(settings.currentWeek);
      setMatches(updated);
      
      // Also refresh all admin data to ensure everything is in sync
      loadAdminData();
      
      showToast('כל המשחקים נמחקו בהצלחה!');
    }
  };

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const currentSettings = dataManager.getSettings();
      const currentMatches = dataManager.getMatches();
      const currentParticipants = dataManager.getUsers();
      const currentLeaderboard = await dataManager.getLeaderboard();
      const currentPot = dataManager.getPot();

      // Debug: Check for duplicate user IDs
      const userIds = currentParticipants.map(u => u.id);
      const duplicateIds = userIds.filter((id, index) => userIds.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        console.warn('Duplicate user IDs found:', duplicateIds);
        // Remove duplicates by keeping only the first occurrence
        const uniqueParticipants = currentParticipants.filter((user, index, arr) => 
          arr.findIndex(u => u.id === user.id) === index
        );
        setParticipants(uniqueParticipants);
      } else {
        setParticipants(currentParticipants);
      }

      setSettings(currentSettings);
      setMatches(currentMatches);
      setLeaderboard(currentLeaderboard);
      setPot(currentPot);
      // init countdown controls
      setCountdownActiveLocal(!!currentSettings.countdownActive);
      const tgt = String(currentSettings.countdownTarget || '');
      if (tgt) {
        const d = tgt.includes('T') ? tgt.split('T')[0] : tgt;
        const t = tgt.includes('T') ? tgt.split('T')[1].slice(0,5) : '';
        setCountdownDate(d);
        setCountdownTime(t);
      } else {
        setCountdownDate('');
        setCountdownTime('');
      }
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
      await dataManager.clearAllMatches(settings.currentWeek);
      
      // יצירת משחקים חדשים
      const newMatches = [];
      if (parsedData.rows && Array.isArray(parsedData.rows)) {
        for (let index = 0; index < parsedData.rows.length; index++) {
          const row = parsedData.rows[index];
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
          const addedMatch = await dataManager.addMatch(match);
          newMatches.push(addedMatch);
        }
      } else if (Array.isArray(parsedData)) {
        // אם הנתונים הם מערך ישיר
        for (let index = 0; index < parsedData.length; index++) {
          const row = parsedData[index];
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
          const addedMatch = await dataManager.addMatch(match);
          newMatches.push(addedMatch);
        }
      }
      
      setMatches(dataManager.getMatches(settings.currentWeek));
      showToast(`נטענו ${newMatches.length} משחקים`);
    } catch (error) {
      console.error('Error uploading JSON:', error);
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
    const updatedMatch = await dataManager.updateMatch(matchId, { [field]: value });
    if (updatedMatch) {
      setMatches((prev) => prev.map((m) => (m.id === matchId ? updatedMatch : m)));
      if (field === 'result') {
        await dataManager.calculateScores();
        setLeaderboard(await dataManager.getLeaderboard());
      }
    }
  };

  const updateSettings = async (newSettings) => {
    await dataManager.updateSettings(newSettings);
    // עדכן את ה-state מיד כדי שה-UI יתעדכן
    setSettings(prev => ({ ...prev, ...newSettings }));
    if (newSettings.currentWeek && newSettings.currentWeek !== settings.currentWeek) {
      await loadAdminData();
    }
    showToast('הגדרות נשמרו בהצלחה');
  };

  const debouncedUpdateSettings = (newSettings) => {
    // עדכן את ה-state מיד
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // נקה timeout קודם אם קיים
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    
    // הגדר timeout חדש
    const timeout = setTimeout(async () => {
      await dataManager.updateSettings(newSettings);
      showToast('הגדרות נשמרו בהצלחה');
    }, 1000); // המתן שנייה אחרי שהמשתמש הפסיק להקליד
    
    setUpdateTimeout(timeout);
  };

  const toggleLockSubmissions = async () => {
    const next = !settings.submissionsLocked;
    await dataManager.updateSettings({ submissionsLocked: next });
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
          await dataManager.clearAllMatches(newWeek);
        }
      }
      await dataManager.updateSettings({ currentWeek: newWeek });
      await loadAdminData();
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
      await dataManager.deleteUserGuessesByUserAndWeek(userIdOrName, settings.currentWeek);
      // רענון מלא של נתוני האדמין כדי לשקף את המחיקה מיד
      await dataManager.calculateScores();
      await loadAdminData();
      showToast('ניחוש המשתתף לשבוע נמחק');
    }
  };

  const clearAllGuessesForCurrentWeek = async () => {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל הניחושים לשבוע הנוכחי?')) {
      await dataManager.clearAllGuesses(settings.currentWeek);
      await dataManager.calculateScores();
      await loadAdminData();
      showToast('כל ניחושי השבוע נמחקו');
    }
  };

  const deleteGuessById = async (guessId) => {
    if (confirm('למחוק את הניחוש לשבוע הנוכחי?')) {
      await dataManager.deleteUserGuess(guessId);
      await dataManager.calculateScores();
      await loadAdminData();
      showToast('הניחוש נמחק');
    }
  };

  const deleteUserCompletely = async (userIdOrName) => {
    if (confirm('למחוק משתמש לחלוטין כולל כל הניחושים? פעולה זו בלתי הפיכה.')) {
      const res = await dataManager.deleteUser(userIdOrName);
      await dataManager.calculateScores();
      await loadAdminData();
      showToast(`נמחקו ${res.usersRemoved} משתמש/ים ו-${res.guessesRemoved} ניחושים.`);
    }
  };

  const updatePaymentStatus = async (guessId, paymentStatus) => {
    const updatedGuess = await dataManager.updateGuessPaymentStatus(guessId, paymentStatus);
    if (updatedGuess) {
      // עדכן את ה-state ישירות במקום לטעון מחדש
      setLeaderboard(prev => prev.map(entry => 
        entry.id === guessId ? { ...entry, paymentStatus: paymentStatus } : entry
      ));
    }
    showToast(`סטטוס התשלום עודכן ל-${paymentStatus === 'paid' ? 'שולם' : 'לא שולם'}`);
  };

  const handleRenameUser = async () => {
    if (!renameUser || !newUserName.trim()) return;
    
    try {
      const updatedUser = await dataManager.renameUser(renameUser.name, newUserName.trim());
      if (updatedUser) {
        // עדכן את ה-state
        setParticipants(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        showToast(`השם שונה מ-"${renameUser.name}" ל-"${newUserName.trim()}"`);
        setShowRenameModal(false);
        setRenameUser(null);
        setNewUserName('');
      }
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const openRenameModal = (user) => {
    setRenameUser(user);
    setNewUserName(user.name);
    setShowRenameModal(true);
  };

  // פונקציות עריכת ניחוש
  const openEditGuessModal = (user, guess) => {
    if (!user || !guess || !guess.guesses) {
      showToast('שגיאה בפתיחת עריכת הניחוש', 'error');
      return;
    }
    
    setEditGuessUser(user);
    setEditGuessData(guess);
    // וידוא שהמערך באורך הנכון (16 ניחושים)
    const guessesArray = Array.isArray(guess.guesses) ? guess.guesses : [];
    const paddedGuesses = [...guessesArray];
    while (paddedGuesses.length < 16) {
      paddedGuesses.push('');
    }
    setTempGuesses(paddedGuesses.slice(0, 16)); // העתקת הניחושים הנוכחיים
    setShowEditGuessModal(true);
  };

  const handleGuessChange = (matchIndex, newGuess) => {
    if (matchIndex < 0 || matchIndex >= tempGuesses.length) {
      console.error('Invalid match index:', matchIndex);
      return;
    }
    
    const newGuesses = [...tempGuesses];
    newGuesses[matchIndex] = newGuess;
    setTempGuesses(newGuesses);
  };

  const saveEditedGuess = async () => {
    if (!editGuessData || !editGuessUser) {
      showToast('שגיאה: נתונים חסרים לעדכון', 'error');
      return;
    }
    
    // בדיקה שההגשה לא נעולה
    if (settings.submissionsLocked) {
      showToast('לא ניתן לשמור ניחושים כאשר ההגשה נעולה', 'error');
      setShowEditGuessModal(false);
      return;
    }
    
    try {
      // עדכון הניחוש
      const updatedGuess = await dataManager.updateUserGuess(editGuessData.id, {
        guesses: tempGuesses,
        updatedAt: new Date().toISOString()
      });
      
      if (!updatedGuess) {
        showToast('לא נמצא הניחוש לעדכון - ייתכן שנמחק', 'error');
        setShowEditGuessModal(false);
        return;
      }
      
      // חישוב מחדש של הניקוד
      await dataManager.calculateScores();
      
      // רענון נתוני האדמין
      await loadAdminData();
      
      showToast(`ניחוש של ${editGuessUser.name} עודכן בהצלחה`);
      setShowEditGuessModal(false);
    } catch (error) {
      console.error('Error saving edited guess:', error);
      showToast('שגיאה בשמירת הניחוש', 'error');
    }
  };

  const closeEditGuessModal = () => {
    setShowEditGuessModal(false);
    setEditGuessUser(null);
    setEditGuessData(null);
    setTempGuesses(Array(16).fill(''));
  };

  // בדיקה שהניחוש עדיין קיים לפני פתיחת המודל
  const handleEditGuessClick = (user, guess) => {
    // בדיקה שההגשה לא נעולה
    if (settings.submissionsLocked) {
      showToast('לא ניתן לערוך ניחושים כאשר ההגשה נעולה', 'error');
      return;
    }
    
    // בדיקה שהניחוש עדיין קיים במערכת
    const currentGuesses = dataManager.getUserGuesses(settings.currentWeek);
    const stillExists = currentGuesses.find(g => g.id === guess.id);
    
    if (!stillExists) {
      showToast('הניחוש נמחק - מרענן נתונים', 'error');
      loadAdminData();
      return;
    }
    
    openEditGuessModal(user, guess);
  };

  const createDefaultMatches = async () => {
    const newMatches = await dataManager.createDefaultMatches(settings.currentWeek);
    setMatches(newMatches);
    showToast(`${newMatches.length} משחקים נוצרו`);
  };

  if (!isAuthenticated) {
    return (
      <>
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
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-blue-600 text-lg">טוען פאנל מנהל...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
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
                { id: 'users', label: 'ניהול משתמשים', icon: Users },
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
                <p className="text-gray-600"></p>
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
                  <>
                    {/* סיכום תשלומים - רק למשתתפים השבועיים */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-bold text-gray-800 mb-3">סיכום תשלומים - שבוע {settings.currentWeek}</h4>
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
                    {sortedWeek.map(({ user, guess }) => (
                      <div key={`participant-${guess.id}`} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-blue-800">{user.name}</h3>
                            <p className="text-sm text-gray-500">
                              הצטרף: {new Date(user.createdAt).toLocaleDateString('he-IL')}
                            </p>
                            <div className="mt-2 text-xs text-blue-600">ניחוש קיים לשבוע {settings.currentWeek}</div>
                          </div>
                          <div className="flex items-center gap-4">
                            {/* צ'ק בוקס תשלום - רק למשתתפים השבועיים */}
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
                                <button onClick={() => deleteGuessById(guess.id)} className="btn btn-danger flex items-center gap-2">
                                  <Trash2 className="w-4 h-4" /> מחק ניחוש לשבוע
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
        })()}
        {activeTab === 'users' && (() => {
          const guessesThisWeek = dataManager.getUserGuesses(settings.currentWeek);
          const byUserId = new Map(guessesThisWeek.map(g => [g.userId, g]))
          const scoreById = new Map(leaderboard.map(l => [l.userId, l.score]))
          const scoreByName = new Map(leaderboard.map(l => [String(l.name||'').toLowerCase().trim(), l.score]))
          const getScore = (u) => (scoreById.get(u.id) ?? scoreByName.get(String(u.name||'').toLowerCase().trim()) ?? 0)
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
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-bold text-blue-800">ניהול משתמשים</h2>
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
                        <div key={`user-${u.id}`} className="flex items-center justify-between border rounded-lg p-3 bg-white">
                          <div className="flex-1">
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
                              <button onClick={() => openRenameModal(u)} className="btn btn-secondary flex items-center gap-2">
                                <Edit className="w-4 h-4" /> שנה שם
                              </button>
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
                      <div className="text-sm text-gray-600">{settings.submissionsLocked ? 'סגור — אי אפשר לשלוח טפסים' : 'פתוח — ניתן לשלוח טפסים'}</div>
                    </div>
                    <button onClick={toggleLockSubmissions} className={`btn ${settings.submissionsLocked ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'btn-secondary'}`}>
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
                        <div className="text-gray-600 text-sm">₪{pot.numOfPlayers > 0 ? ((settings.totoFirstPrize || 8000000) / pot.numOfPlayers).toLocaleString('he-IL', { maximumFractionDigits: 2 }) : '0'} למשתתף</div>
                      </div>
                    </div>
                  </div>

                  {/* הגדרת שעון רץ */}
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h3 className="font-bold text-blue-800 mb-2">שעון רץ</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <input id="cdActive" type="checkbox" checked={countdownActiveLocal} onChange={(e)=>{setCountdownActiveLocal(e.target.checked);}} />
                      <label htmlFor="cdActive" className="text-sm text-gray-700">הפעל שעון רץ</label>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <input type="date" value={countdownDate} onChange={(e)=>{setCountdownDate(e.target.value);}} className="input w-40" />
                      <input type="time" value={countdownTime} onChange={(e)=>{setCountdownTime(e.target.value);}} className="input w-32" />
                      <button onClick={async ()=>{
                        const target = (countdownDate && countdownTime) ? `${countdownDate}T${countdownTime}` : '';
                        if (countdownActiveLocal && !target) { showToast('יש להזין תאריך ושעה ליעד', 'error'); return; }
                        dataManager.updateSettings({ countdownActive: !!(countdownActiveLocal && target), countdownTarget: target });
                        await (dataManager.mergeAndSave ? dataManager.mergeAndSave({ headers: getAdminHeaders(), preferLocalSettings: true }) : Promise.resolve());
                        await dataManager.syncFromServer();
                        loadAdminData();
                        showToast('הגדרות שעון נשמרו');
                      }} className="btn btn-secondary">שמור</button>
                    </div>
                    {countdownActiveLocal && countdownDate && countdownTime && (
                      <div className="text-sm text-gray-600 mt-2">יעד: {countdownDate} {countdownTime}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* מודל שינוי שם */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">שינוי שם משתמש</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם נוכחי</label>
                <input
                  type="text"
                  value={renameUser?.name || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם חדש</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="הזן שם חדש"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRenameModal(false);
                  setRenameUser(null);
                  setNewUserName('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                ביטול
              </button>
              <button
                onClick={handleRenameUser}
                disabled={!newUserName.trim() || newUserName.trim() === renameUser?.name}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                שנה שם
              </button>
            </div>
          </div>
        </div>
      )}

      {/* מודל עריכת ניחוש */}
      {showEditGuessModal && editGuessUser && editGuessData && editGuessData.guesses && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              עריכת ניחוש - {editGuessUser.name}
            </h3>
            <div className="space-y-6">
              {/* סיכום נוכחי */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-bold text-gray-800 mb-2">ניחושים נוכחיים:</h4>
                <div className="grid grid-cols-8 gap-2">
                  {editGuessData.guesses.map((guess, index) => (
                    <div key={index} className="text-center p-2 bg-white rounded border">
                      <div className="text-xs text-gray-600">{index + 1}</div>
                      <div className="text-lg font-bold">{guess || '?'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* עריכת ניחושים */}
              <div>
                <h4 className="font-bold text-gray-800 mb-4">ערוך ניחושים:</h4>
                {matches.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">אין משחקים זמינים לעריכה</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {matches.map((match, index) => (
                    <div key={match.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="text-center mb-3">
                        <h5 className="font-bold text-blue-800 text-sm">משחק {index + 1}</h5>
                        <div className="text-sm font-bold text-green-700">
                          {match.homeTeam} vs {match.awayTeam}
                        </div>
                      </div>
                      <div className="flex justify-center gap-2">
                        {['1', 'X', '2'].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleGuessChange(index, option)}
                            className={`w-10 h-10 rounded-full text-lg font-bold transition-all ${
                              tempGuesses[index] === option
                                ? 'bg-blue-500 text-white shadow-lg scale-110'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </div>

              {/* סיכום חדש */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-bold text-gray-800 mb-2">ניחושים חדשים:</h4>
                <div className="grid grid-cols-8 gap-2">
                  {tempGuesses.map((guess, index) => (
                    <div key={index} className="text-center p-2 bg-white rounded border">
                      <div className="text-xs text-gray-600">{index + 1}</div>
                      <div className="text-lg font-bold">{guess || '?'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeEditGuessModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                ביטול
              </button>
              <button
                onClick={saveEditedGuess}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                שמור שינויים
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
