'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { HomeData, Countdown } from '../types';
import { dataManager } from '../lib/data-manager';
import { apiClient } from '../lib/api-client';
import { getMatchesByDay, parseLocalDateTime } from '../lib/utils';
import { UI_CONSTANTS } from '../lib/constants';

export const useHomeData = (): HomeData => {
  const router = useRouter();
  const [pot, setPot] = useState({ totalAmount: 0, numOfPlayers: 0, amountPerPlayer: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [matches, setMatches] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState<Countdown>({
    active: false,
    target: '',
    d: 0,
    h: 0,
    m: 0,
    s: 0
  });
  const [settings, setSettings] = useState({
    totoFirstPrize: 8000000,
    entryFee: 35,
    submissionsLocked: false,
    countdownActive: false,
    countdownTarget: '',
    currentWeek: 1
  });

  const topScore = leaderboard.length ? leaderboard[0].score : null;
  const matchesByDay = getMatchesByDay(matches);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await dataManager.initialize();
      
      // Refresh pot
      try {
        const potResponse = await apiClient.getPot(settings.currentWeek);
        if (potResponse.ok && potResponse.data) {
          setPot(potResponse.data);
        } else {
          const localPot = await dataManager.getPot();
          setPot(localPot);
        }
      } catch (error) {
        console.error('Failed to fetch pot:', error);
        const localPot = await dataManager.getPot();
        setPot(localPot);
      }

      // Refresh leaderboard
      try {
        const leaderboardResponse = await apiClient.getLeaderboard(settings.currentWeek);
        if (leaderboardResponse.ok && leaderboardResponse.data) {
          setLeaderboard(leaderboardResponse.data.leaderboard);
        } else {
          const localLeaderboard = await dataManager.getLeaderboard();
          setLeaderboard(localLeaderboard);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        const localLeaderboard = await dataManager.getLeaderboard();
        setLeaderboard(localLeaderboard);
      }

      // Refresh matches
      const currentMatches = await dataManager.getMatches();
      setMatches(currentMatches);

      // Refresh settings
      const currentSettings = await dataManager.getSettings();
      setSettings(currentSettings);

      // Update countdown
      if (currentSettings.countdownActive && currentSettings.countdownTarget) {
        setCountdown({
          active: true,
          target: currentSettings.countdownTarget,
          d: 0,
          h: 0,
          m: 0,
          s: 0
        });
      } else {
        setCountdown({
          active: false,
          target: '',
          d: 0,
          h: 0,
          m: 0,
          s: 0
        });
      }
    } finally {
      // Full refresh like F5
      if (typeof window !== 'undefined') {
        window.location.reload();
      } else {
        router.refresh();
      }
    }
  }, [settings.currentWeek, router]);

  // Initial data loading
  useEffect(() => {
    const init = async () => {
      await dataManager.initialize();
      
      // Load pot
      let currentPot = await dataManager.getPot();
      try {
        const potResponse = await apiClient.getPot();
        if (potResponse.ok && potResponse.data) {
          currentPot = potResponse.data;
        }
      } catch (error) {
        console.error('Failed to fetch pot:', error);
      }
      setPot(currentPot);

      // Load leaderboard
      try {
        const leaderboardResponse = await apiClient.getLeaderboard();
        if (leaderboardResponse.ok && leaderboardResponse.data) {
          setLeaderboard(leaderboardResponse.data.leaderboard);
        } else {
          const localLeaderboard = await dataManager.getLeaderboard();
          setLeaderboard(localLeaderboard);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        const localLeaderboard = await dataManager.getLeaderboard();
        setLeaderboard(localLeaderboard);
      }

      // Load matches
      const currentMatches = await dataManager.getMatches();
      setMatches(currentMatches);

      // Load settings
      const currentSettings = await dataManager.getSettings();
      setSettings(currentSettings);

      // Setup countdown
      if (currentSettings.countdownActive && currentSettings.countdownTarget) {
        setCountdown({
          active: true,
          target: currentSettings.countdownTarget,
          d: 0,
          h: 0,
          m: 0,
          s: 0
        });
      } else {
        setCountdown({
          active: false,
          target: '',
          d: 0,
          h: 0,
          m: 0,
          s: 0
        });
      }
    };

    init();

    // Refresh on visibility change
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        init();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!countdown.active || !countdown.target) return;

    const calculateCountdown = async () => {
      const now = new Date();
      const target = parseLocalDateTime(countdown.target);
      
      if (!target) {
        setCountdown(prev => ({ ...prev, active: false, d: 0, h: 0, m: 0, s: 0 }));
        return;
      }

      const diff = target.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown(prev => ({ ...prev, d: 0, h: 0, m: 0, s: 0, active: false }));
        // Lock submissions and disable countdown
        await dataManager.updateSettings({ 
          submissionsLocked: true, 
          countdownActive: false 
        });
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(prev => ({ ...prev, d, h, m, s }));
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, UI_CONSTANTS.COUNTDOWN_INTERVAL);
    
    return () => clearInterval(interval);
  }, [countdown.active, countdown.target]);

  return {
    pot,
    leaderboard,
    matches,
    isRefreshing,
    countdown,
    settings,
    topScore,
    matchesByDay,
    refreshData
  };
};
