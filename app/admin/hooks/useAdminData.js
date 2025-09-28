'use client';

import { useState, useEffect } from 'react';

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
      
      // טען את כל הנתונים מהשרת דרך API routes
      const [dataResponse, leaderboardResponse, potResponse] = await Promise.all([
        fetch('/api/data?legacy=true'),
        fetch('/api/leaderboard'),
        fetch('/api/pot')
      ]);

      const data = await dataResponse.json();
      const currentSettings = data.settings;
      console.log('Settings loaded:', currentSettings);
      const currentMatches = data.matches;
      console.log('Matches loaded:', currentMatches);
      const currentParticipants = data.users;
      console.log('Participants loaded:', currentParticipants);
      const currentGuesses = data.userGuesses;
      console.log('Guesses loaded:', currentGuesses);
      const leaderboardData = await leaderboardResponse.json();
      const currentLeaderboard = leaderboardData.leaderboard || leaderboardData;
      console.log('Leaderboard loaded:', currentLeaderboard);
      const currentPot = await potResponse.json();
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
        setCountdownDate(tgt);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await loadAdminData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const response = await fetch('/api/update-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      
      if (response.ok) {
        await loadAdminData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  };

  const updateCountdown = async (active, target) => {
    try {
      const response = await fetch('/api/update-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countdownActive: active,
          countdownTarget: target
        }),
      });
      
      if (response.ok) {
        await loadAdminData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating countdown:', error);
      return false;
    }
  };

  const updateAdminEmail = async (email) => {
    try {
      const response = await fetch('/api/update-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: email }),
      });
      
      if (response.ok) {
        await loadAdminData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating admin email:', error);
      return false;
    }
  };

  const createNewWeek = async () => {
    try {
      const response = await fetch('/api/create-default-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleanPreviousMatches: cleanNewWeekMatches }),
      });
      
      if (response.ok) {
        await loadAdminData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error creating new week:', error);
      return false;
    }
  };

  const clearAllMatches = async () => {
    try {
      const response = await fetch('/api/clear-matches', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        await loadAdminData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error clearing matches:', error);
      return false;
    }
  };

  const clearAllGuesses = async () => {
    try {
      const response = await fetch('/api/clear-guesses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        await loadAdminData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error clearing guesses:', error);
      return false;
    }
  };

  const deleteUser = async (userId) => {
    try {
      const response = await fetch('/api/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (response.ok) {
        await loadAdminData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  };

  const deleteUserGuesses = async (userId) => {
    try {
      const response = await fetch('/api/delete-user-guesses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (response.ok) {
        await loadAdminData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting user guesses:', error);
      return false;
    }
  };

  const updatePaymentStatus = async (guessId, paymentStatus) => {
    try {
      const response = await fetch('/api/update-payment-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guessId, paymentStatus }),
      });
      
      if (response.ok) {
        await loadAdminData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating payment status:', error);
      return false;
    }
  };

  const renameUser = async (oldName, newName) => {
    try {
      const response = await fetch('/api/rename-user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName, newName }),
      });
      
      if (response.ok) {
        await loadAdminData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error renaming user:', error);
      return false;
    }
  };

  const addMatch = async (matchData) => {
    try {
      const response = await fetch('/api/add-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchData),
      });
      
      if (response.ok) {
        await loadAdminData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding match:', error);
      return false;
    }
  };

  const updateMatch = async (matchId, updates) => {
    try {
      const response = await fetch('/api/update-match', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, ...updates }),
      });
      
      if (response.ok) {
        await loadAdminData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating match:', error);
      return false;
    }
  };

  const deleteMatch = async (matchId) => {
    try {
      const response = await fetch('/api/delete-match', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });
      
      if (response.ok) {
        await loadAdminData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting match:', error);
      return false;
    }
  };

  const updateGuess = async (guessId, updates) => {
    try {
      const response = await fetch('/api/update-guess', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guessId, ...updates }),
      });
      
      if (response.ok) {
        await loadAdminData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating guess:', error);
      return false;
    }
  };

  const deleteGuess = async (guessId) => {
    try {
      const response = await fetch('/api/delete-guess', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guessId }),
      });
      
      if (response.ok) {
        await loadAdminData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting guess:', error);
      return false;
    }
  };

  return {
    // State
    isLoading,
    settings,
    tempAdminEmail,
    matches,
    participants,
    leaderboard,
    pot,
    guessesThisWeek,
    isRefreshing,
    sortWeek,
    sortAll,
    cleanNewWeekMatches,
    countdownActiveLocal,
    countdownDate,
    countdownTime,
    updateTimeout,
    
    // Setters
    setSortWeek,
    setSortAll,
    setCleanNewWeekMatches,
    setCountdownActiveLocal,
    setCountdownDate,
    setCountdownTime,
    setUpdateTimeout,
    setTempAdminEmail,
    
    // Actions
    loadAdminData,
    refreshData,
    updateSettings,
    updateCountdown,
    updateAdminEmail,
    createNewWeek,
    clearAllMatches,
    clearAllGuesses,
    deleteUser,
    deleteUserGuesses,
    updatePaymentStatus,
    renameUser,
    addMatch,
    updateMatch,
    deleteMatch,
    updateGuess,
    deleteGuess
  };
};
