'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { dataManager } from '../../src/lib/data-manager';

// Import components
import AdminHeader from './components/AdminHeader';
import AdminTabs from './components/AdminTabs';
import MatchesTab from './components/MatchesTab';
import ParticipantsTab from './components/ParticipantsTab';
import UsersTab from './components/UsersTab';
import BackupsTab from './components/BackupsTab';
import SettingsTab from './components/SettingsTab';
import RenameUserModal from './components/RenameUserModal';
import EditGuessModal from './components/EditGuessModal';

// DataManager loaded successfully

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('matches');
  const [toast, setToast] = useState(null);
  const [adminToken, setAdminToken] = useState('');

  // Data states
  const [settings, setSettings] = useState({ 
    adminPassword: '1234', 
    entryFee: 35, 
    totoFirstPrize: 8000000, 
    submissionsLocked: false, 
    adminEmail: '' 
  });
  const [tempAdminEmail, setTempAdminEmail] = useState('');
  const [matches, setMatches] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [pot, setPot] = useState({ totalAmount: 0, numOfPlayers: 0 });
  const [guessesThisWeek, setGuessesThisWeek] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Sorting states
  const [sortWeek, setSortWeek] = useState('score_desc');
  const [sortAll, setSortAll] = useState('name_asc');
  
  // Countdown states
  const [countdownActiveLocal, setCountdownActiveLocal] = useState(false);
  const [countdownDate, setCountdownDate] = useState('');
  const [countdownTime, setCountdownTime] = useState('');
  const [updateTimeout, setUpdateTimeout] = useState(null);
  
  // Modal states
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameUser, setRenameUser] = useState(null);
  const [newUserName, setNewUserName] = useState('');
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

  const sendBackupToEmail = async () => {
    const emailToUse = settings.adminEmail || tempAdminEmail;
    if (!emailToUse) {
      showToast('אנא הגדר כתובת מייל בהגדרות המערכת', 'error');
      return;
    }

    if (!confirm(`האם לשלוח גיבוי למייל ${emailToUse}?`)) {
      return;
    }

    setIsLoading(true);
    try {
      // יצירת גיבוי
      const backupResponse = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create',
          triggerAction: 'Manual backup from admin panel'
        })
      });
      const backupResult = await backupResponse.json();
      
      if (!backupResult.success) {
        throw new Error(backupResult.error);
      }

      // שליחת המייל עם הגיבוי
      const emailResponse = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          backupData: backupResult.fullBackupData || backupResult,
          recipientEmail: emailToUse
        })
      });

      const emailResult = await emailResponse.json();
      
      if (emailResult.success) {
        showToast('גיבוי נשלח בהצלחה למייל!');
      } else {
        throw new Error(emailResult.error);
      }
    } catch (error) {
      console.error('Error sending backup email:', error);
      showToast(`שגיאה בשליחת הגיבוי: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }

  const testEmailService = async () => {
    const emailToUse = settings.adminEmail || tempAdminEmail;
    if (!emailToUse) {
      showToast('אנא הגדר כתובת מייל בהגדרות המערכת', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const testEmailResponse = await fetch('/api/send-email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: emailToUse,
          subject: 'בדיקת שירות מייל - טוטו שלוש',
          message: 'זוהי הודעת בדיקה. אם אתה רואה את זה, שירות המייל עובד!'
        })
      });

      const testResult = await testEmailResponse.json();
      
      if (testResult.success) {
        showToast('שירות המייל עובד! בדוק את תיבת המייל שלך.');
      } else {
        showToast(`שירות המייל לא עובד: ${testResult.error}`, 'error');
      }
    } catch (error) {
      console.error('Error testing email service:', error);
      showToast(`שגיאה בבדיקת שירות המייל: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }

  const deleteMatch = async (matchId) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את המשחק?')) {
      await dataManager.deleteMatch(matchId);
      await dataManager.initialize();
      const updatedMatches = await dataManager.getMatches();
      setMatches(updatedMatches);
      showToast('משחק נמחק');
    }
  };

  const clearAllMatches = async () => {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל המשחקים?')) {
      // Clear all matches
      await dataManager.clearAllMatches();
      
      // Update UI state
      const updated = await dataManager.getMatches();
      setMatches(updated);
      
      // Also refresh all admin data to ensure everything is in sync
      loadAdminData();
      
      showToast('כל המשחקים נמחקו בהצלחה!');
    }
  };

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading admin data...');
      const currentSettings = await dataManager.getSettings();
      console.log('Settings loaded:', currentSettings);
      const currentMatches = await dataManager.getMatches();
      console.log('Matches loaded:', currentMatches);
      const currentParticipants = await dataManager.getUsers();
      console.log('Participants loaded:', currentParticipants);
      const currentGuesses = await dataManager.getUserGuesses();
      console.log('Guesses loaded:', currentGuesses);
      const currentLeaderboard = await dataManager.getLeaderboard();
      console.log('Leaderboard loaded:', currentLeaderboard);
      const currentPot = await dataManager.getPot();
      console.log('Pot loaded:', currentPot);

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
      setTempAdminEmail(currentSettings.adminEmail || '');
      setMatches(currentMatches);
      setGuessesThisWeek(currentGuesses);
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
      
      // מחיקת משחקים קיימים
      await dataManager.clearAllMatches();
      
      // יצירת משחקים חדשים
      const newMatches = [];
      if (parsedData.rows && Array.isArray(parsedData.rows)) {
        for (let index = 0; index < parsedData.rows.length; index++) {
          const row = parsedData.rows[index];
          const match = {
            week: 1,
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
            week: 1,
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
      
      setMatches(await dataManager.getMatches());
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
    try {
      await dataManager.updateSettings(newSettings);
      // עדכן את ה-state מיד כדי שה-UI יתעדכן
      setSettings(prev => ({ ...prev, ...newSettings }));
      showToast('הגדרות נשמרו בהצלחה');
    } catch (error) {
      console.error('Error updating settings:', error);
      showToast('שגיאה בשמירת ההגדרות', 'error');
    }
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

  // מערכת השבועות הוסרה - משחק אחד בלבד

  const deleteGuessesForUserCurrentWeek = async (userIdOrName) => {
    if (confirm('למחוק את הניחוש של המשתתף?')) {
      await dataManager.deleteUserGuessesByUser(userIdOrName);
      // רענון מלא של נתוני האדמין כדי לשקף את המחיקה מיד
      await dataManager.calculateScores();
      await loadAdminData();
      showToast('ניחוש המשתתף נמחק');
    }
  };

  const clearAllGuessesForCurrentWeek = async () => {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל הניחושים?')) {
      await dataManager.clearAllGuesses();
      await dataManager.calculateScores();
      await loadAdminData();
      showToast('כל הניחושים נמחקו');
    }
  };

  const deleteGuessById = async (guessId) => {
    if (confirm('למחוק את הניחוש?')) {
      await dataManager.deleteUserGuess(guessId);
      await dataManager.calculateScores();
      await loadAdminData();
      showToast('הניחוש נמחק');
    }
  };

  const deleteUserCompletely = async (userIdOrName) => {
    if (confirm('למחוק משתמש לחלוטין כולל כל הניחושים? פעולה זו בלתי הפיכה.')) {
      try {
        // השתמש ב-API route שירוץ בצד השרת עם גישה ל-Vercel KV
        const response = await fetch('/api/delete-user', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: userIdOrName }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete user');
        }

        const result = await response.json();
        
        // רענן את הנתונים
        await dataManager.calculateScores();
        await loadAdminData();
        
        showToast(`נמחקו ${result.usersRemoved} משתמש/ים ו-${result.guessesRemoved} ניחושים.`);
      } catch (error) {
        console.error('Error deleting user:', error);
        showToast('שגיאה במחיקת המשתמש');
      }
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
  const handleEditGuessClick = async (user, guess) => {
    // בדיקה שההגשה לא נעולה
    if (settings.submissionsLocked) {
      showToast('לא ניתן לערוך ניחושים כאשר ההגשה נעולה', 'error');
      return;
    }
    
    // בדיקה שהניחוש עדיין קיים במערכת
      const currentGuesses = await dataManager.getUserGuesses();
      const stillExists = currentGuesses.find(g => g.id === guess.id);
    
    if (!stillExists) {
      showToast('הניחוש נמחק - מרענן נתונים', 'error');
      loadAdminData();
      return;
    }
    
    openEditGuessModal(user, guess);
  };

  const createDefaultMatches = async () => {
    const newMatches = await dataManager.createDefaultMatches();
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
                <button type="submit" className="btn bg-blue-600 hover:bg-blue-700 text-white w-full py-3 text-lg font-bold">
                  <Shield className="w-5 h-5 ml-2" /> כניסה
                </button>
              </form>
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

  // Helper functions for sorting and data processing
  const getScore = (u) => {
    const scoreById = new Map(leaderboard.map(l => [l.userId, l.score]));
    const scoreByName = new Map(leaderboard.map(l => [String(l.name||'').toLowerCase().trim(), l.score]));
    return (scoreById.get(u.id) ?? scoreByName.get(String(u.name||'').toLowerCase().trim()) ?? 0);
  };

  // Prepare data for components
          const participantsWithGuess = guessesThisWeek.map(g => ({
            guess: g,
            user: participants.find(p => p.id === g.userId) || { id: g.userId, name: g.name, phone: g.phone, createdAt: g.createdAt }
          }));

  const byUserId = new Map(guessesThisWeek.map(g => [g.userId, g]));

          const sortedWeek = [...participantsWithGuess].sort((a,b) => {
    const sa = getScore(a.user), sb = getScore(b.user);
    const na = String(a.user.name||'').toLowerCase(), nb = String(b.user.name||'').toLowerCase();
            switch (sortWeek) {
      case 'score_asc': return sa - sb || na.localeCompare(nb);
      case 'name_asc': return na.localeCompare(nb);
      case 'name_desc': return nb.localeCompare(na);
              case 'score_desc':
      default: return sb - sa || na.localeCompare(nb);
            }
  });

          const sortedAll = [...participants].sort((a,b) => {
    const hasA = byUserId.has(a.id), hasB = byUserId.has(b.id);
    const na = String(a.name||'').toLowerCase(), nb = String(b.name||'').toLowerCase();
    const ta = new Date(a.createdAt||0).getTime(), tb = new Date(b.createdAt||0).getTime();
            switch (sortAll) {
      case 'name_desc': return nb.localeCompare(na);
      case 'joined_new': return tb - ta;
      case 'joined_old': return ta - tb;
      case 'hasguess_first': return (hasB?1:0) - (hasA?1:0) || nb.localeCompare(na);
              case 'name_asc':
      default: return na.localeCompare(nb);
            }
  });

          return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100" dir="rtl">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {toast && (
            <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded text-white shadow ${toast.type==='success'?'bg-green-600':'bg-red-600'}`}>
              {toast.msg}
                          </div>
          )}
          
          <AdminHeader 
            isRefreshing={isRefreshing}
            refreshAll={refreshAll}
          />
          
          <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          {activeTab === 'matches' && (
            <MatchesTab 
              matches={matches}
              uploadJSON={uploadJSON}
              createDefaultMatches={createDefaultMatches}
              clearAllMatches={clearAllMatches}
              updateMatch={updateMatch}
              deleteMatch={deleteMatch}
              formatDateForInput={formatDateForInput}
              formatDateDisplay={formatDateDisplay}
            />
          )}
          {activeTab === 'participants' && (
            <ParticipantsTab 
              participantsWithGuess={sortedWeek}
              sortWeek={sortWeek}
              setSortWeek={setSortWeek}
              clearAllGuessesForCurrentWeek={clearAllGuessesForCurrentWeek}
              settings={settings}
              updatePaymentStatus={updatePaymentStatus}
              handleEditGuessClick={handleEditGuessClick}
              deleteGuessById={deleteGuessById}
              getScore={getScore}
            />
          )}
          {activeTab === 'users' && (
            <UsersTab 
              participants={sortedAll}
              sortAll={sortAll}
              setSortAll={setSortAll}
              byUserId={byUserId}
              getScore={getScore}
              openRenameModal={openRenameModal}
              deleteUserCompletely={deleteUserCompletely}
            />
          )}
          {activeTab === 'backups' && (
            <BackupsTab 
              sendBackupToEmail={sendBackupToEmail}
              testEmailService={testEmailService}
              resetLocalCache={resetLocalCache}
              isLoading={isLoading}
              settings={settings}
              tempAdminEmail={tempAdminEmail}
              setTempAdminEmail={setTempAdminEmail}
              updateSettings={updateSettings}
              showToast={showToast}
            />
          )}
          
          {activeTab === 'settings' && (
            <SettingsTab 
              settings={settings}
              updateSettings={updateSettings}
              debouncedUpdateSettings={debouncedUpdateSettings}
              toggleLockSubmissions={toggleLockSubmissions}
              tempAdminEmail={tempAdminEmail}
              setTempAdminEmail={setTempAdminEmail}
              matches={matches}
              leaderboard={leaderboard}
              pot={pot}
              countdownActiveLocal={countdownActiveLocal}
              setCountdownActiveLocal={setCountdownActiveLocal}
              countdownDate={countdownDate}
              setCountdownDate={setCountdownDate}
              countdownTime={countdownTime}
              setCountdownTime={setCountdownTime}
              getAdminHeaders={getAdminHeaders}
              dataManager={dataManager}
              loadAdminData={loadAdminData}
              showToast={showToast}
            />
          )}
              </div>

        <RenameUserModal 
          showRenameModal={showRenameModal}
          setShowRenameModal={setShowRenameModal}
          renameUser={renameUser}
          setRenameUser={setRenameUser}
          newUserName={newUserName}
          setNewUserName={setNewUserName}
          handleRenameUser={handleRenameUser}
        />

        <EditGuessModal 
          showEditGuessModal={showEditGuessModal}
          editGuessUser={editGuessUser}
          editGuessData={editGuessData}
          tempGuesses={tempGuesses}
          handleGuessChange={handleGuessChange}
          closeEditGuessModal={closeEditGuessModal}
          saveEditedGuess={saveEditedGuess}
          matches={matches}
        />
    </div>
    </>
  );
}
