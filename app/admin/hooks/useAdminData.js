'use client';

import { useState, useEffect } from 'react';
import { dataManager } from '../../../src/lib/data-manager';

export const useAdminData = () => {
  const [isLoading, setIsLoading] = useState(false);
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
  const [sortWeek, setSortWeek] = useState('score_desc');
  const [sortAll, setSortAll] = useState('name_asc');
  const [cleanNewWeekMatches, setCleanNewWeekMatches] = useState(true);
  const [countdownActiveLocal, setCountdownActiveLocal] = useState(false);
  const [countdownDate, setCountdownDate] = useState('');
  const [countdownTime, setCountdownTime] = useState('');
  const [updateTimeout, setUpdateTimeout] = useState(null);

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

  const refreshAll = async () => {
    setIsRefreshing(true);
    try {
      await dataManager.initialize();
      loadAdminData();
    } finally {
      // ריענון מלא כמו F5
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };

  const resetLocalCache = async () => {
    if (!confirm('לאפס קאש מקומי ולמשוך מהשרת?')) return;
    try {
      showToast('מרענן נתונים מהשרת');
      await dataManager.initialize();
      loadAdminData();
    } finally {
      if (typeof window !== 'undefined') window.location.reload();
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

  const showToast = (msg, type = 'success') => {
    // This will be handled by the parent component
    console.log(`Toast: ${msg} (${type})`);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [updateTimeout]);

  return {
    // State
    isLoading,
    settings,
    tempAdminEmail,
    setTempAdminEmail,
    matches,
    participants,
    leaderboard,
    pot,
    guessesThisWeek,
    isRefreshing,
    sortWeek,
    setSortWeek,
    sortAll,
    setSortAll,
    cleanNewWeekMatches,
    setCleanNewWeekMatches,
    countdownActiveLocal,
    setCountdownActiveLocal,
    countdownDate,
    setCountdownDate,
    countdownTime,
    setCountdownTime,
    updateTimeout,
    setUpdateTimeout,
    
    // Functions
    loadAdminData,
    refreshAll,
    resetLocalCache,
    updateSettings,
    debouncedUpdateSettings,
    showToast
  };
};
