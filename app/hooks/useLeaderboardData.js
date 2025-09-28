'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const useLeaderboardData = () => {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState([]);
  const [pot, setPot] = useState({ totalAmount: 0, numOfPlayers: 0 });
  const [matchesForWeek, setMatchesForWeek] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const topScore = leaderboard.length ? leaderboard[0].score : null;

  // טען נתונים פעם אחת
  useEffect(() => {
    loadData();
    
    // בדוק אם הגענו לדף אחרי הוספת ניחוש
    const shouldRefresh = sessionStorage.getItem('shouldRefreshLeaderboard');
    if (shouldRefresh) {
      sessionStorage.removeItem('shouldRefreshLeaderboard');
      // עדכון מיידי
      loadData();
      // עדכון נוסף אחרי שנייה כדי לוודא שהכל מעודכן
      setTimeout(() => loadData(), 1000);
    }
  }, []);

  // עדכון מיידי כשמגיעים לדף (למשל אחרי הוספת ניחוש)
  useEffect(() => {
    const handleFocus = () => {
      loadData();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // עדכון אוטומטי כל 30 שניות
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    // השתמש ב-API routes כדי לקבל נתונים עדכניים מהשרת
    console.log('🔄 Loading leaderboard data...');
    try {
      // טען את כל הנתונים דרך API routes
      const [leaderboardResponse, matchesResponse, potResponse] = await Promise.all([
        fetch('/api/leaderboard', { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }),
        fetch('/api/data?legacy=true', { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }),
        fetch('/api/pot', { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
      ]);

      const leaderboardData = await leaderboardResponse.json();
      const dataResponse = await matchesResponse.json();
      const potData = await potResponse.json();

      const lb = leaderboardData.leaderboard || leaderboardData;
      const matches = dataResponse.matches || [];
      const pot = potData;

      console.log(`✅ Loaded ${lb.length} leaderboard entries`);
      setLeaderboard(lb);
      setMatchesForWeek(matches);
      setPot(pot);
    } catch (e) {
      console.error('Error loading data:', e);
      setLeaderboard([]);
      setMatchesForWeek([]);
      setPot({ totalAmount: 0, numOfPlayers: 0, amountPerPlayer: 35 });
    }
  };

  const refreshNow = async () => {
    setIsRefreshing(true);
    try {
      loadData();
    } finally {
      // ריענון מלא כמו F5
      if (typeof window !== 'undefined') {
        window.location.reload();
      } else {
        router.refresh();
      }
    }
  };

  const toggleExpanded = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ייצוא כל הניחושים כקובץ XLS (HTML) עם יישור למרכז
  const exportGuessesExcel = () => {
    const users = leaderboard;
    const matches = matchesForWeek;
    if (!users || users.length === 0) { alert('אין משתתפים לשבוע זה.'); return; }
    if (!matches || matches.length === 0) { alert('אין משחקים לשבוע זה.'); return; }

    const headers = ['משחק', ...users.map(u => (u.user?.name || u.name || ''))];
    const rows = matches.map((m, i) => [ String(i + 1), ...users.map(u => (u.guesses?.[i] || '')) ]);

    const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;');
    const thead = `<tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr>`;
    const tbody = rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
    const html = `<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="utf-8" />
      <style>table{border-collapse:collapse;font-family:sans-serif}th,td{border:1px solid #ccc;padding:6px 8px;text-align:center}th{background:#e5efff}</style>
    </head><body>
      <h3 style=\"text-align:center;margin:0 0 8px\">טבלת ניחושים — שבוע 1</h3>
      <table>${thead}${tbody}</table>
    </body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toto-guesses-matrix.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // יצוא כתמונה (PNG) – שורות=משחקים, עמודות=משתתפים
  const exportGuessesPNG = () => {
    const users = leaderboard;
    const matches = matchesForWeek;
    if (!users || users.length === 0) { alert('אין משתתפים לשבוע זה.'); return; }
    if (!matches || matches.length === 0) { alert('אין משחקים לשבוע זה.'); return; }

    const rows = matches.length;
    const cols = 1 + users.length;
    const firstColW = 70;
    const colW = (users.length <= 8) ? 140 : (users.length <= 12 ? 110 : 90);
    const rowH = 40;
    const headerH = 100; // גבוה כדי לאפשר שמות בזווית
    const pad = 20;
    const baseW = pad * 2 + firstColW + (cols - 1) * colW;
    const baseH = pad * 2 + headerH + rows * rowH;
    const maxW = 3200;
    const scale = baseW > maxW ? (maxW / baseW) : 1;

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(baseW * scale);
    canvas.height = Math.floor(baseH * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    // רקע כללי
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, baseW, baseH);

    // כותרת עליונה
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`טבלת ניחושים`, baseW - pad, pad + 22);

    // רקע ראש טבלה
    ctx.fillStyle = '#e6f0ff';
    ctx.fillRect(pad, pad + 30, baseW - 2*pad, headerH - 30);

    // חישוב עמודות ב-RTL
    const colLeft = (c) => (c === 0)
      ? (baseW - pad - firstColW)
      : (baseW - pad - firstColW - c*colW);
    const colCenter = (c) => colLeft(c) + (c === 0 ? firstColW/2 : colW/2);

    // כותרת עמודה ראשונה (מימין)
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('משחק', colCenter(0), pad + headerH - 12);

    // שמות משתתפים — מיושרים אופקית, התאמת גודל ושבירה לשתי שורות אם צריך
    const fitAndDrawName = (text, centerX) => {
      const maxW = colW - 10;
      const parts = (() => {
        const t = String(text || '').trim();
        if (t.length <= 12) return [t];
        const mid = Math.floor(t.length / 2);
        // ננסה לשבור במרווח הקרוב לאמצע
        let idx = t.lastIndexOf(' ', mid);
        if (idx === -1) idx = t.indexOf(' ', mid);
        if (idx === -1) return [t];
        return [t.slice(0, idx), t.slice(idx + 1)];
      })();
      // בחר גודל גופן שמתאים לשתי השורות
      let fontSize = 14;
      const minSize = 10;
      while (fontSize >= minSize) {
        ctx.font = `bold ${fontSize}px sans-serif`;
        const ok = parts.every(line => ctx.measureText(line).width <= maxW);
        if (ok) break;
        fontSize -= 1;
      }
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      if (parts.length === 1) {
        ctx.fillText(parts[0], centerX, pad + headerH - 14);
      } else {
        const y1 = pad + headerH - 26;
        const y2 = pad + headerH - 10;
        ctx.fillText(parts[0], centerX, y1);
        ctx.fillText(parts[1], centerX, y2);
      }
    };
    users.forEach((u, i) => {
      const name = String(u.user?.name || u.name || '');
      const centerX = colCenter(i + 1);
      fitAndDrawName(name, centerX);
    });

    // קווי גריד ראשיים
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(pad, pad + headerH);
    ctx.lineTo(baseW - pad, pad + headerH);
    ctx.stroke();

    // שורות עם פסים (זברה)
    for (let r = 0; r < rows; r++) {
      const top = pad + headerH + r*rowH;
      if (r % 2 === 0) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(pad, top, baseW - 2*pad, rowH);
      }
      // מספר משחק
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(r + 1), colCenter(0), top + rowH/2 + 6);

      // ניחושי משתמשים
      users.forEach((u, c) => {
        const guess = (u.guesses || [])[r] || '';
        const cx = colCenter(c + 1);
        ctx.fillStyle = guess ? '#111827' : '#9ca3af';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(guess || '-', cx, top + rowH/2 + 6);
      });
    }

    // גבולות אנכיים (RTL): ימין, עמודות, שמאל
    ctx.strokeStyle = '#e5e7eb';
    // ימין
    ctx.beginPath(); ctx.moveTo(baseW - pad, pad + 30); ctx.lineTo(baseW - pad, baseH - pad); ctx.stroke();
    for (let c = 0; c < cols; c++) {
      const x = colLeft(c);
      ctx.beginPath();
      ctx.moveTo(x, pad + 30);
      ctx.lineTo(x, baseH - pad);
      ctx.stroke();
    }
    // שמאל
    ctx.beginPath(); ctx.moveTo(pad, pad + 30); ctx.lineTo(pad, baseH - pad); ctx.stroke();
    // גבולות אופקיים
    for (let r = 0; r <= rows; r++) {
      const yy = pad + headerH + r*rowH;
      ctx.beginPath(); ctx.moveTo(pad, yy); ctx.lineTo(baseW - pad, yy); ctx.stroke();
    }

    // הורדה
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `toto-guesses-matrix.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // "PDF" דרך חלון הדפסה (משתמש יכול לשמור כ-PDF)
  const exportGuessesPDF = () => {
    const users = leaderboard;
    const matches = matchesForWeek;
    if (!users || users.length === 0 || !matches || matches.length === 0) { alert('אין נתונים לייצוא.'); return; }
    const headers = ['משחק', ...users.map(u => (u.user?.name || u.name || ''))];
    const rows = matches.map((m,i)=>[String(i+1), ...users.map(u => (u.guesses?.[i]||''))]);
    const esc = (s)=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;');
    const thead = `<tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>`;
    const tbody = rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('');
    const html = `<!DOCTYPE html><html lang=he dir=rtl><head><meta charset=utf-8>
      <title>טבלת ניחושים</title>
      <style>table{border-collapse:collapse;font-family:sans-serif;width:100%}th,td{border:1px solid #ccc;padding:6px 8px;text-align:center}th{background:#e5efff}</style>
    </head><body>
      <h3 style="text-align:center;margin:0 0 8px">טבלת ניחושים</h3>
      <table>${thead}${tbody}</table>
      <script>window.onload=()=>setTimeout(()=>window.print(),50)</script>
    </body></html>`;
    const w = window.open('', '_blank'); if (!w) { alert('חסימת פופ-אפ מונעת ייצוא. אפשר לאפשר חלונות קופצים.'); return; }
    w.document.open(); w.document.write(html); w.document.close();
  };

  return {
    leaderboard,
    pot,
    matchesForWeek,
    expanded,
    isRefreshing,
    topScore,
    loadData,
    refreshNow,
    toggleExpanded,
    exportGuessesExcel,
    exportGuessesPNG,
    exportGuessesPDF
  };
};
