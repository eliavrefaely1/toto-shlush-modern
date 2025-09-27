'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { dataManager } from '../../src/lib/data-manager';

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
      await dataManager.initialize();
      try {
        const w = dataManager.getSettings().currentWeek || 1;
        const resPot = await fetch(`/api/pot?week=${w}`, { cache: 'no-store' });
        if (resPot.ok) setPot(await resPot.json()); else setPot(dataManager.getPot());
      } catch (_) { setPot(dataManager.getPot()); }
      try {
        const w = dataManager.getSettings().currentWeek || 1;
        const res = await fetch(`/api/leaderboard?week=${w}`, { cache: 'no-store' });
        if (res.ok) {
          const j = await res.json();
          setLeaderboard(Array.isArray(j.leaderboard) ? j.leaderboard : []);
        } else {
          setLeaderboard(await dataManager.getLeaderboard());
        }
      } catch (_) {
        setLeaderboard(await dataManager.getLeaderboard());
      }
      // רענן גם משחקים
      const currentMatches = dataManager.getMatches();
      setMatches(currentMatches);
      // רענן הגדרות
      const s = dataManager.getSettings();
      setSettings(s);
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
      await dataManager.initialize();
      // משוך קופה מהשרת (קל משקל)
      let currentPot = await dataManager.getPot();
      try {
        const s = await dataManager.getSettings();
        const resPot = await fetch(`/api/pot`, { cache: 'no-store' });
        if (resPot.ok) currentPot = await resPot.json();
      } catch (_) {}
      // משוך דירוג מהיר מהשרת (קל משקל)
      try {
        const res = await fetch(`/api/leaderboard`, { cache: 'no-store' });
        if (res.ok) {
          const j = await res.json();
          setLeaderboard(Array.isArray(j.leaderboard) ? j.leaderboard : []);
        } else {
          setLeaderboard(await dataManager.getLeaderboard());
        }
      } catch (_) {
        setLeaderboard(await dataManager.getLeaderboard());
      }
      // טען משחקים
      const currentMatches = await dataManager.getMatches();
      setMatches(currentMatches);
      setPot(currentPot);
      const s = await dataManager.getSettings();
      setSettings(s);
      if (s.countdownActive && s.countdownTarget) {
        setCountdown({active:true, target:s.countdownTarget, d:0,h:0,m:0,s:0});
      } else {
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
        await dataManager.updateSettings({ submissionsLocked: true, countdownActive: false });
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
