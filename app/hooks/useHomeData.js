'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const useHomeData = () => {
  const router = useRouter();
  const [pot, setPot] = useState({ totalAmount: 0, numOfPlayers: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [matches, setMatches] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState({active:false, target:'', d:0,h:0,m:0,s:0});
  const [settings, setSettings] = useState({ totoFirstPrize: 8000000 });

  const topScore = leaderboard.length ? leaderboard[0].score : null;

  // פונקציה למיון משחקים לפי ימים
  const getMatchesByDay = () => {
    if (!matches || !Array.isArray(matches) || matches.length === 0) return {};
    
    const matchesByDay = {};
    const dayOrder = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    
    matches.forEach(match => {
      let dayName = 'לא מוגדר';
      let dayIndex = 999; // ימים לא מוגדרים יופיעו בסוף
      
      if (match.date) {
        try {
          const date = new Date(match.date);
          const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
          dayName = dayNames[date.getDay()];
          dayIndex = date.getDay();
        } catch (e) {
          // אם התאריך לא תקין, נשאיר "לא מוגדר"
        }
      }
      
      if (!matchesByDay[dayName]) {
        matchesByDay[dayName] = { matches: [], dayIndex };
      }
      
      matchesByDay[dayName].matches.push(match);
    });
    
    // מיון המשחקים בכל יום לפי תאריך ושעה (הכי מוקדם ראשון)
    Object.keys(matchesByDay).forEach(day => {
      matchesByDay[day].matches.sort((a, b) => {
        // קודם לפי תאריך
        const dateA = a.date || '1900-01-01';
        const dateB = b.date || '1900-01-01';
        const dateCompare = dateA.localeCompare(dateB);
        if (dateCompare !== 0) return dateCompare;
        
        // אם התאריך זהה, מיון לפי שעה
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeA.localeCompare(timeB);
      });
    });
    
    // מיון הימים לפי התאריך האמיתי (הכי מוקדם ראשון)
    const sortedDays = Object.keys(matchesByDay).sort((a, b) => {
      // מיון לפי התאריך של המשחק הכי מוקדם בכל יום
      const earliestA = matchesByDay[a].matches[0];
      const earliestB = matchesByDay[b].matches[0];
      
      if (earliestA && earliestB) {
        const dateA = earliestA.date || '1900-01-01';
        const dateB = earliestB.date || '1900-01-01';
        const dateCompare = dateA.localeCompare(dateB);
        if (dateCompare !== 0) return dateCompare;
        
        // אם אותו תאריך, מיון לפי השעה של המשחק הכי מוקדם
        const timeA = earliestA.time || '00:00';
        const timeB = earliestB.time || '00:00';
        return timeA.localeCompare(timeB);
      }
      
      // אם אין תאריכים, מיון לפי אינדקס היום
      return matchesByDay[a].dayIndex - matchesByDay[b].dayIndex;
    });
    
    // החזר אובייקט ממוין
    const sortedMatchesByDay = {};
    sortedDays.forEach(day => {
      sortedMatchesByDay[day] = matchesByDay[day].matches;
    });
    
    return sortedMatchesByDay;
  };

  const matchesByDay = getMatchesByDay();

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      // השתמש ב-API routes כדי לקבל נתונים עדכניים מהשרת
      const [dataResponse, leaderboardResponse, potResponse] = await Promise.all([
        fetch('/api/data?legacy=true'),
        fetch('/api/leaderboard'),
        fetch('/api/pot')
      ]);

      const data = await dataResponse.json();
      const leaderboardData = await leaderboardResponse.json();
      const potData = await potResponse.json();

      const currentMatches = data.matches || [];
      const currentSettings = data.settings || {};
      const currentPot = potData;
      const currentLeaderboard = leaderboardData.leaderboard || leaderboardData;
      
      setMatches(currentMatches);
      setSettings(currentSettings);
      setPot(currentPot);
      setLeaderboard(currentLeaderboard);
    } finally {
      // ריענון מלא כמו F5
      if (typeof window !== 'undefined') {
        window.location.reload();
      } else {
        router.refresh();
      }
    }
  };

  // טעינת נתונים ראשונית
  useEffect(() => {
    const init = async () => {
      try {
        // השתמש ב-API routes כדי לקבל נתונים עדכניים מהשרת
        const [dataResponse, leaderboardResponse, potResponse] = await Promise.all([
          fetch('/api/data?legacy=true', { cache: 'no-store' }),
          fetch('/api/leaderboard', { cache: 'no-store' }),
          fetch('/api/pot', { cache: 'no-store' })
        ]);

        const data = await dataResponse.json();
        const leaderboardData = await leaderboardResponse.json();
        const potData = await potResponse.json();

        const currentMatches = data.matches || [];
        const currentSettings = data.settings || {};
        const currentPot = potData;
        const currentLeaderboard = leaderboardData.leaderboard || leaderboardData;

        setMatches(currentMatches);
        setSettings(currentSettings);
        setPot(currentPot);
        setLeaderboard(currentLeaderboard);

        if (currentSettings.countdownActive && currentSettings.countdownTarget) {
          setCountdown({active:true, target:currentSettings.countdownTarget, d:0,h:0,m:0,s:0});
        } else {
          setCountdown({active:false, target:'', d:0,h:0,m:0,s:0});
        }
      } catch (error) {
        console.error('Error loading home data:', error);
        // הגדרות ברירת מחדל
        setMatches([]);
        setSettings({ totoFirstPrize: 8000000 });
        setPot({ totalAmount: 0, numOfPlayers: 0 });
        setLeaderboard([]);
        setCountdown({active:false, target:'', d:0,h:0,m:0,s:0});
      }
    };
    init();

    const onVis = () => { if (document.visibilityState === 'visible') init() };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // טיימר שעון רץ
  useEffect(() => {
    if (!countdown.active || !countdown.target) return;
    const parseLocal = (s) => {
      // Expecting YYYY-MM-DDTHH:mm or full ISO; build as local time to avoid TZ issues
      try {
        if (!s) return null;
        if (s.includes('T')) {
          const [d,t] = s.split('T');
          const [y,m,da] = d.split('-').map(n=>parseInt(n,10));
          const [hh,mm] = (t||'').slice(0,5).split(':').map(n=>parseInt(n,10));
          if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(da)) {
            return new Date(y, (m||1)-1, da, hh||0, mm||0, 0);
          }
        }
        const dt = new Date(s);
        return isNaN(dt.getTime()) ? null : dt;
      } catch { return null }
    }
    const calc = async () => {
      const now = new Date();
      const tgt = parseLocal(countdown.target);
      if (!tgt) return;
      const diff = tgt.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown((c)=>({...c,d:0,h:0,m:0,s:0, active:false}));
        // נעל הגשה אוטומטית וכבה שעון
        try {
          await fetch('/api/update-settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              settings: { submissionsLocked: true, countdownActive: false } 
            }),
          });
        } catch (error) {
          console.error('Error updating settings:', error);
        }
        return;
      }
      const d = Math.floor(diff / (1000*60*60*24));
      const h = Math.floor((diff % (1000*60*60*24))/(1000*60*60));
      const m = Math.floor((diff % (1000*60*60))/(1000*60));
      const s = Math.floor((diff % (1000*60))/1000);
      setCountdown((c)=>({...c,d,h,m,s}));
    }
    calc();
    const iv = setInterval(() => calc(), 1000);
    return ()=>clearInterval(iv);
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
