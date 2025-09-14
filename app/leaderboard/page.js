'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trophy, Medal, Star, Target, ArrowLeft, Crown, Award, RefreshCw, Users } from 'lucide-react'
import dataManager from '../lib/data.js'

const Leaderboard = () => {
  const players = [
    { rank: 1, name: 'תומר עדיני', points: 50 },
    { rank: 2, name: 'אדיר לריח', points: 43.5 },
    { rank: 3, name: 'Adam Zerhen', points: 42 },
    { rank: 4, name: 'שי חן', points: 41 },
    { rank: 5, name: 'לירון גרתי', points: 40.5 },
    { rank: 6, name: 'Ohad Forer', points: 40 },
    { rank: 7, name: 'rang clan', points: 39.5 },
    { rank: 8, name: 'Yuval Morag', points: 39.5 },
    { rank: 9, name: 'Itay Emanuel', points: 39 },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">טבלת דירוג</h1>
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">דירוג</th>
            <th className="border border-gray-300 p-2">שם</th>
            <th className="border border-gray-300 p-2">נקודות</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.rank} className="text-center">
              <td className="border border-gray-300 p-2">{player.rank}</td>
              <td className="border border-gray-300 p-2">{player.name}</td>
              <td className="border border-gray-300 p-2">{player.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function LeaderboardPage() {
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState([])
  const [pot, setPot] = useState({ totalAmount: 0, numOfPlayers: 0 })
  const [selectedWeek, setSelectedWeek] = useState(dataManager.getSettings().currentWeek || 1)
  const [availableWeeks, setAvailableWeeks] = useState([1])
  const [matchesForWeek, setMatchesForWeek] = useState([])
  const [expanded, setExpanded] = useState({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const topScore = leaderboard.length ? leaderboard[0].score : null

  // אתחול פעם אחת: מושך מהשרת ומגדיר לשבוע הנוכחי
  useEffect(() => {
    const init = async () => {
      await dataManager.syncFromServer()
      const w = dataManager.getSettings().currentWeek || 1
      setSelectedWeek(w)
    }
    init()
  }, [])

  // כל שינוי בשבוע טוען מחדש את הנתונים
  useEffect(() => {
    loadData()
  }, [selectedWeek])

  const loadData = async () => {
    // משוך דירוג מהיר מהשרת + נתוני משחקים וניחושים לשבוע
    try {
      const w = selectedWeek
      const [lbRes, dataRes] = await Promise.all([
        fetch(`/api/leaderboard?week=${w}`, { cache: 'no-store' }),
        fetch(`/api/data?week=${w}&fields=matches,guesses,settings`, { cache: 'no-store' })
      ])
      let lb = []
      if (lbRes.ok) {
        const j = await lbRes.json()
        lb = Array.isArray(j.leaderboard) ? j.leaderboard : []
      }
      let matches = [], guesses = [], entryFee = dataManager.getSettings().entryFee
      if (dataRes.ok) {
        const d = await dataRes.json()
        matches = Array.isArray(d.matches) ? d.matches : []
        guesses = Array.isArray(d.userGuesses) ? d.userGuesses : []
        if (typeof d.entryFee === 'number') entryFee = d.entryFee
      }

      // העשרת הדירוג בניחושים לצורך תצוגה מורחבת
      const byUserId = new Map(guesses.map(g => [g.userId, g]))
      const byName = new Map(guesses.map(g => [String(g.name||'').toLowerCase().trim(), g]))
      const enriched = lb.map(e => {
        const g = byUserId.get(e.userId) || byName.get(String(e.name||'').toLowerCase().trim())
        return g ? { ...e, guesses: g.guesses } : e
      })

      setLeaderboard(enriched)
      setMatchesForWeek(matches)
      // חישוב קופה מקומי קל
      setPot({ totalAmount: (guesses.length * entryFee), numOfPlayers: guesses.length, amountPerPlayer: entryFee })

      // טעינת שבועות זמינים
      const allWeeks = [...new Set((dataManager.data.userGuesses || []).map(g => g.week))]
      if (!allWeeks.includes(selectedWeek)) allWeeks.push(selectedWeek)
      allWeeks.sort((a,b)=>b-a)
      setAvailableWeeks(allWeeks.length > 0 ? allWeeks : [selectedWeek || 1])
    } catch (e) {
      // נפילה — fallback לנתונים מקומיים
      const currentLeaderboard = dataManager.getLeaderboard(selectedWeek)
      const currentPot = dataManager.getPot(selectedWeek)
      const weekMatches = dataManager.getMatches(selectedWeek) || []
      setLeaderboard(currentLeaderboard)
      setPot(currentPot)
      setMatchesForWeek(weekMatches)
    }
  }

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="w-6 h-6 text-yellow-500" />
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />
    if (index === 2) return <Award className="w-6 h-6 text-orange-500" />
    return <Star className="w-6 h-6 text-gray-300" />
  }

  const getRankColor = (index) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-400 to-yellow-500'
    if (index === 1) return 'bg-gradient-to-r from-gray-300 to-gray-400'
    if (index === 2) return 'bg-gradient-to-r from-orange-400 to-orange-500'
    return 'bg-gradient-to-r from-gray-200 to-gray-300'
  }

  const getScoreMessage = (score) => {
    if (score >= 16) return "טוטו שלוש הגעת – את הקופה כמעט לקחת! 🎯"
    if (score >= 12) return "מעולה! אתה בדרך הנכונה! 🚀"
    if (score >= 8) return "לא רע בכלל! עוד קצת ואתה שם! 💪"
    if (score >= 4) return "יש לך פוטנציאל! תמשיך לנסות! 🎯"
    return "יצאת עגל – 3 ניחושים השבוע? 🐄"
  }

  const getScoreEmoji = (score) => {
    if (score >= 16) return "🏆"
    if (score >= 12) return "🥇"
    if (score >= 8) return "🥈"
    if (score >= 4) return "🥉"
    return "🐄"
  }

  const refreshNow = async () => {
    setIsRefreshing(true)
    try {
      await dataManager.syncFromServer();
      loadData();
    } finally {
      // ריענון מלא כמו F5
      if (typeof window !== 'undefined') {
        window.location.reload()
      } else {
        router.refresh()
      }
    }
  }

  const toggleExpanded = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // ייצוא כל הניחושים כקובץ XLS (HTML) עם יישור למרכז
  const exportGuessesExcel = () => {
    const users = leaderboard
    const matches = matchesForWeek
    if (!users || users.length === 0) { alert('אין משתתפים לשבוע זה.'); return }
    if (!matches || matches.length === 0) { alert('אין משחקים לשבוע זה.'); return }

    const headers = ['משחק', ...users.map(u => (u.user?.name || u.name || ''))]
    const rows = matches.map((m, i) => [ String(i + 1), ...users.map(u => (u.guesses?.[i] || '')) ])

    const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    const thead = `<tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr>`
    const tbody = rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')
    const html = `<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="utf-8" />
      <style>table{border-collapse:collapse;font-family:sans-serif}th,td{border:1px solid #ccc;padding:6px 8px;text-align:center}th{background:#e5efff}</style>
    </head><body>
      <h3 style=\"text-align:center;margin:0 0 8px\">טבלת ניחושים — שבוע ${selectedWeek}</h3>
      <table>${thead}${tbody}</table>
    </body></html>`

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `toto-week-${selectedWeek}-guesses-matrix.xls`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // יצוא כתמונה (PNG) – שורות=משחקים, עמודות=משתתפים
  const exportGuessesPNG = () => {
    const users = leaderboard
    const matches = matchesForWeek
    if (!users || users.length === 0) { alert('אין משתתפים לשבוע זה.'); return }
    if (!matches || matches.length === 0) { alert('אין משחקים לשבוע זה.'); return }

    const rows = matches.length
    const cols = 1 + users.length
    const firstColW = 70
    const colW = (users.length <= 8) ? 140 : (users.length <= 12 ? 110 : 90)
    const rowH = 40
    const headerH = 100 // גבוה כדי לאפשר שמות בזווית
    const pad = 20
    const baseW = pad * 2 + firstColW + (cols - 1) * colW
    const baseH = pad * 2 + headerH + rows * rowH
    const maxW = 3200
    const scale = baseW > maxW ? (maxW / baseW) : 1

    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(baseW * scale)
    canvas.height = Math.floor(baseH * scale)
    const ctx = canvas.getContext('2d')
    ctx.scale(scale, scale)

    // רקע כללי
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, baseW, baseH)

    // כותרת עליונה
    ctx.fillStyle = '#1e3a8a'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`טבלת ניחושים — שבוע ${selectedWeek}`, baseW - pad, pad + 22)

    // רקע ראש טבלה
    ctx.fillStyle = '#e6f0ff'
    ctx.fillRect(pad, pad + 30, baseW - 2*pad, headerH - 30)

    // חישוב עמודות ב-RTL
    const colLeft = (c) => (c === 0)
      ? (baseW - pad - firstColW)
      : (baseW - pad - firstColW - c*colW)
    const colCenter = (c) => colLeft(c) + (c === 0 ? firstColW/2 : colW/2)

    // כותרת עמודה ראשונה (מימין)
    ctx.fillStyle = '#0f172a'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('משחק', colCenter(0), pad + headerH - 12)

    // שמות משתתפים — מיושרים אופקית, התאמת גודל ושבירה לשתי שורות אם צריך
    const fitAndDrawName = (text, centerX) => {
      const maxW = colW - 10
      const parts = (() => {
        const t = String(text || '').trim()
        if (t.length <= 12) return [t]
        const mid = Math.floor(t.length / 2)
        // ננסה לשבור במרווח הקרוב לאמצע
        let idx = t.lastIndexOf(' ', mid)
        if (idx === -1) idx = t.indexOf(' ', mid)
        if (idx === -1) return [t]
        return [t.slice(0, idx), t.slice(idx + 1)]
      })()
      // בחר גודל גופן שמתאים לשתי השורות
      let fontSize = 14
      const minSize = 10
      while (fontSize >= minSize) {
        ctx.font = `bold ${fontSize}px sans-serif`
        const ok = parts.every(line => ctx.measureText(line).width <= maxW)
        if (ok) break
        fontSize -= 1
      }
      ctx.fillStyle = '#0f172a'
      ctx.textAlign = 'center'
      if (parts.length === 1) {
        ctx.fillText(parts[0], centerX, pad + headerH - 14)
      } else {
        const y1 = pad + headerH - 26
        const y2 = pad + headerH - 10
        ctx.fillText(parts[0], centerX, y1)
        ctx.fillText(parts[1], centerX, y2)
      }
    }
    users.forEach((u, i) => {
      const name = String(u.user?.name || u.name || '')
      const centerX = colCenter(i + 1)
      fitAndDrawName(name, centerX)
    })

    // קווי גריד ראשיים
    ctx.strokeStyle = '#cbd5e1'
    ctx.beginPath();
    ctx.moveTo(pad, pad + headerH)
    ctx.lineTo(baseW - pad, pad + headerH)
    ctx.stroke()

    // שורות עם פסים (זברה)
    for (let r = 0; r < rows; r++) {
      const top = pad + headerH + r*rowH
      if (r % 2 === 0) {
        ctx.fillStyle = '#f8fafc'
        ctx.fillRect(pad, top, baseW - 2*pad, rowH)
      }
      // מספר משחק
      ctx.fillStyle = '#111827'
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(String(r + 1), colCenter(0), top + rowH/2 + 6)

      // ניחושי משתמשים
      users.forEach((u, c) => {
        const guess = (u.guesses || [])[r] || ''
        const cx = colCenter(c + 1)
        ctx.fillStyle = guess ? '#111827' : '#9ca3af'
        ctx.font = 'bold 16px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(guess || '-', cx, top + rowH/2 + 6)
      })
    }

    // גבולות אנכיים (RTL): ימין, עמודות, שמאל
    ctx.strokeStyle = '#e5e7eb'
    // ימין
    ctx.beginPath(); ctx.moveTo(baseW - pad, pad + 30); ctx.lineTo(baseW - pad, baseH - pad); ctx.stroke()
    for (let c = 0; c < cols; c++) {
      const x = colLeft(c)
      ctx.beginPath()
      ctx.moveTo(x, pad + 30)
      ctx.lineTo(x, baseH - pad)
      ctx.stroke()
    }
    // שמאל
    ctx.beginPath(); ctx.moveTo(pad, pad + 30); ctx.lineTo(pad, baseH - pad); ctx.stroke()
    // גבולות אופקיים
    for (let r = 0; r <= rows; r++) {
      const yy = pad + headerH + r*rowH
      ctx.beginPath(); ctx.moveTo(pad, yy); ctx.lineTo(baseW - pad, yy); ctx.stroke()
    }

    // הורדה
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `toto-week-${selectedWeek}-guesses-matrix.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  // "PDF" דרך חלון הדפסה (משתמש יכול לשמור כ-PDF)
  const exportGuessesPDF = () => {
    const users = leaderboard
    const matches = matchesForWeek
    if (!users || users.length === 0 || !matches || matches.length === 0) { alert('אין נתונים לייצוא.'); return }
    const headers = ['משחק', ...users.map(u => (u.user?.name || u.name || ''))]
    const rows = matches.map((m,i)=>[String(i+1), ...users.map(u => (u.guesses?.[i]||''))])
    const esc = (s)=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    const thead = `<tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>`
    const tbody = rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')
    const html = `<!DOCTYPE html><html lang=he dir=rtl><head><meta charset=utf-8>
      <title>טבלת ניחושים — שבוע ${selectedWeek}</title>
      <style>table{border-collapse:collapse;font-family:sans-serif;width:100%}th,td{border:1px solid #ccc;padding:6px 8px;text-align:center}th{background:#e5efff}</style>
    </head><body>
      <h3 style="text-align:center;margin:0 0 8px">טבלת ניחושים — שבוע ${selectedWeek}</h3>
      <table>${thead}${tbody}</table>
      <script>window.onload=()=>setTimeout(()=>window.print(),50)</script>
    </body></html>`
    const w = window.open('', '_blank'); if (!w) { alert('חסימת פופ-אפ מונעת ייצוא. אפשר לאפשר חלונות קופצים.'); return }
    w.document.open(); w.document.write(html); w.document.close()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100" dir="rtl">
      <div className="relative z-10">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* כותרת */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-blue-800">טבלת דירוג</h1>
          </div>
          
          {/* בחירת שבוע */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <label className="text-lg font-medium text-gray-700">שבוע:</label>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
              className="input w-32 text-center"
            >
              {availableWeeks.map(week => (
                <option key={week} value={week}>שבוע {week}</option>
              ))}
            </select>
            <button onClick={refreshNow} disabled={isRefreshing} className="btn btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'מרענן...' : 'רענן'}
            </button>
            <button onClick={exportGuessesPNG} className="btn btn-primary flex items-center gap-2">
              ייצוא תמונה (PNG)
            </button>
          </div>

          {/* קופה */}
          <div className="card mb-8">
            <div className="card-content">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center text-blue-900">
                <div className="text-5xl font-bold mb-2">₪{pot.totalAmount.toLocaleString()}</div>
                <p className="text-lg">{pot.numOfPlayers} משתתפים × ₪{pot.amountPerPlayer}</p>
              </div>
            </div>
          </div>
        </div>

        {/* טבלת דירוג */}
        {leaderboard.length === 0 ? (
          <div className="card text-center py-16">
            <div className="card-content">
              <Target className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-600 mb-2">אין משתתפים עדיין</h3>
              <p className="text-gray-500 mb-6">היה הראשון להצטרף לתחרות!</p>
              <Link href="/guess" className="btn btn-primary text-lg py-3 px-6">
                מלא טופס עכשיו! 🎯
              </Link>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <h3 className="text-xl font-bold text-blue-800 flex items-center gap-2">
                <Users className="w-6 h-6" />
                טבלת המחזור
              </h3>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div key={entry.id}>
                    <div className={`flex items-center justify-between p-2 rounded-md ${
                      topScore !== null && entry.score === topScore ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white ${
                          (topScore !== null && entry.score === topScore) ? 'bg-green-600' :
                          index === 1 ? 'bg-blue-500' :
                          index === 2 ? 'bg-blue-400' :
                          'bg-blue-300'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-bold text-sm">{entry.user?.name || entry.name}</div>
                          <div className="text-xs text-gray-500">{entry.user?.phone || entry.phone}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">{entry.score}</div>
                          <div className="text-xs text-gray-500">נקודות</div>
                        </div>
                        <button
                          className="btn btn-secondary text-sm"
                          onClick={() => toggleExpanded(entry.id)}
                        >
                          {expanded[entry.id] ? 'הסתר ניחושים' : 'הצג ניחושים'}
                        </button>
                      </div>
                    </div>
                    {expanded[entry.id] && (
                      <div className="mt-2 bg-gray-50 rounded-lg p-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {(matchesForWeek || []).map((m, i) => {
                            const guess = entry.guesses?.[i] || ''
                            const hasResult = !!m.result
                            const correct = hasResult && !!guess && m.result === guess
                            const wrong = hasResult && !!guess && m.result !== guess
                            const boxClasses = `p-2 rounded border ${
                              correct ? 'bg-green-50 border-green-200' :
                              wrong ? 'bg-red-50 border-red-200' :
                              'bg-white border-gray-200'
                            }`
                            const guessColor = correct ? 'text-green-700' : (wrong ? 'text-red-700' : 'text-gray-800')
                            return (
                              <div key={`${entry.id}_${i}`} className={boxClasses}>
                                <div className="text-xs text-gray-500 mb-1">משחק {i + 1}</div>
                                <div className="text-sm font-medium text-gray-800">{m.homeTeam} vs {m.awayTeam}</div>
                                <div className="text-sm mt-1">
                                  ניחוש: <span className={`font-bold ${guessColor}`}>{guess || '?'}</span>
                                  {m.result ? (
                                    <span className="text-gray-500"> · תוצאה: <span className="font-bold">{m.result}</span></span>
                                  ) : null}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* כפתורי פעולה */}
        <div className="flex justify-center gap-4 mt-8">
          <Link href="/" className="btn btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            חזרה לדף הבית
          </Link>
          <Link href="/guess" className="btn btn-primary flex items-center gap-2">
            <Target className="w-4 h-4" />
            מלא טופס חדש
          </Link>
        </div>
      </div>
      </div>
    </div>
  )
}
