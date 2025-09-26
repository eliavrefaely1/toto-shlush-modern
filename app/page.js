'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Users, Star, Target, Gift, RefreshCw, Calendar, CheckCircle } from 'lucide-react'
import dataManager from './lib/data.js'

export default function Home() {
  const router = useRouter()
  const [pot, setPot] = useState({ totalAmount: 0, numOfPlayers: 0 })
  const [leaderboard, setLeaderboard] = useState([])
  const [matches, setMatches] = useState([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [countdown, setCountdown] = useState({active:false, target:'', d:0,h:0,m:0,s:0})
  const [settings, setSettings] = useState({ totoFirstPrize: 8000000 })
  const topScore = leaderboard.length ? leaderboard[0].score : null

  useEffect(() => {
    const init = async () => {
      await dataManager.initialize()
      // משוך קופה מהשרת (קל משקל)
      let currentPot = await dataManager.getPot()
      try {
        const s = await dataManager.getSettings()
        const resPot = await fetch(`/api/pot`, { cache: 'no-store' })
        if (resPot.ok) currentPot = await resPot.json()
      } catch (_) {}
      // משוך דירוג מהיר מהשרת (קל משקל)
      try {
        const res = await fetch(`/api/leaderboard`, { cache: 'no-store' })
        if (res.ok) {
          const j = await res.json()
          setLeaderboard(Array.isArray(j.leaderboard) ? j.leaderboard : [])
        } else {
          setLeaderboard(await dataManager.getLeaderboard())
        }
      } catch (_) {
        setLeaderboard(await dataManager.getLeaderboard())
      }
      // טען משחקים
      const currentMatches = await dataManager.getMatches()
      setMatches(currentMatches)
      setPot(currentPot)
      const s = await dataManager.getSettings()
      setSettings(s)
      if (s.countdownActive && s.countdownTarget) {
        setCountdown({active:true, target:s.countdownTarget, d:0,h:0,m:0,s:0})
      } else {
        setCountdown({active:false, target:'', d:0,h:0,m:0,s:0})
      }
    }
    init()

    const onVis = () => { if (document.visibilityState === 'visible') init() }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // (שמור להמשך אם תרצה הודעות דירוג קצרות)

  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      await dataManager.initialize()
      try {
        const w = dataManager.getSettings().currentWeek || 1
        const resPot = await fetch(`/api/pot?week=${w}`, { cache: 'no-store' })
        if (resPot.ok) setPot(await resPot.json()); else setPot(dataManager.getPot())
      } catch (_) { setPot(dataManager.getPot()) }
      try {
        const w = dataManager.getSettings().currentWeek || 1
        const res = await fetch(`/api/leaderboard?week=${w}`, { cache: 'no-store' })
        if (res.ok) {
          const j = await res.json()
          setLeaderboard(Array.isArray(j.leaderboard) ? j.leaderboard : [])
        } else {
          setLeaderboard(await dataManager.getLeaderboard())
        }
      } catch (_) {
        setLeaderboard(await dataManager.getLeaderboard())
      }
      // רענן גם משחקים
      const currentMatches = dataManager.getMatches()
      setMatches(currentMatches)
      // רענן הגדרות
      const s = dataManager.getSettings()
      setSettings(s)
    } finally {
      // ריענון מלא כמו F5
      if (typeof window !== 'undefined') {
        window.location.reload()
      } else {
        router.refresh()
      }
    }
  }

  // טיימר שעון רץ
  useEffect(() => {
    if (!countdown.active || !countdown.target) return
    const parseLocal = (s) => {
      // Expecting YYYY-MM-DDTHH:mm or full ISO; build as local time to avoid TZ issues
      try {
        if (!s) return null
        if (s.includes('T')) {
          const [d,t] = s.split('T')
          const [y,m,da] = d.split('-').map(n=>parseInt(n,10))
          const [hh,mm] = (t||'').slice(0,5).split(':').map(n=>parseInt(n,10))
          if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(da)) {
            return new Date(y, (m||1)-1, da, hh||0, mm||0, 0)
          }
        }
        const dt = new Date(s)
        return isNaN(dt.getTime()) ? null : dt
      } catch { return null }
    }
    const calc = async () => {
      const now = new Date()
      const tgt = parseLocal(countdown.target)
      if (!tgt) return
      const diff = tgt.getTime() - now.getTime()
      if (diff <= 0) {
        setCountdown((c)=>({...c,d:0,h:0,m:0,s:0, active:false}))
        // נעל הגשה אוטומטית וכבה שעון
        await dataManager.updateSettings({ submissionsLocked: true, countdownActive: false })
        return
      }
      const d = Math.floor(diff / (1000*60*60*24))
      const h = Math.floor((diff % (1000*60*60*24))/(1000*60*60))
      const m = Math.floor((diff % (1000*60*60))/(1000*60))
      const s = Math.floor((diff % (1000*60))/1000)
      setCountdown((c)=>({...c,d,h,m,s}))
    }
    calc()
    const iv = setInterval(() => calc(), 1000)
    return ()=>clearInterval(iv)
  }, [countdown.active, countdown.target])

  // פונקציה למיון משחקים לפי ימים
  const getMatchesByDay = () => {
    if (!matches || !Array.isArray(matches) || matches.length === 0) return {}
    
    const matchesByDay = {}
    const dayOrder = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
    
    matches.forEach(match => {
      let dayName = 'לא מוגדר'
      let dayIndex = 999 // ימים לא מוגדרים יופיעו בסוף
      
      if (match.date) {
        try {
          const date = new Date(match.date)
          const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
          dayName = dayNames[date.getDay()]
          dayIndex = date.getDay()
        } catch (e) {
          // אם התאריך לא תקין, נשאיר "לא מוגדר"
        }
      }
      
      if (!matchesByDay[dayName]) {
        matchesByDay[dayName] = { matches: [], dayIndex }
      }
      
      matchesByDay[dayName].matches.push(match)
    })
    
    // מיון המשחקים בכל יום לפי תאריך ושעה (הכי מוקדם ראשון)
    Object.keys(matchesByDay).forEach(day => {
      matchesByDay[day].matches.sort((a, b) => {
        // קודם לפי תאריך
        const dateA = a.date || '1900-01-01'
        const dateB = b.date || '1900-01-01'
        const dateCompare = dateA.localeCompare(dateB)
        if (dateCompare !== 0) return dateCompare
        
        // אם התאריך זהה, מיון לפי שעה
        const timeA = a.time || '00:00'
        const timeB = b.time || '00:00'
        return timeA.localeCompare(timeB)
      })
    })
    
    // מיון הימים לפי התאריך האמיתי (הכי מוקדם ראשון)
    const sortedDays = Object.keys(matchesByDay).sort((a, b) => {
      // מיון לפי התאריך של המשחק הכי מוקדם בכל יום
      const earliestA = matchesByDay[a].matches[0]
      const earliestB = matchesByDay[b].matches[0]
      
      if (earliestA && earliestB) {
        const dateA = earliestA.date || '1900-01-01'
        const dateB = earliestB.date || '1900-01-01'
        const dateCompare = dateA.localeCompare(dateB)
        if (dateCompare !== 0) return dateCompare
        
        // אם אותו תאריך, מיון לפי השעה של המשחק הכי מוקדם
        const timeA = earliestA.time || '00:00'
        const timeB = earliestB.time || '00:00'
        return timeA.localeCompare(timeB)
      }
      
      // אם אין תאריכים, מיון לפי אינדקס היום
      return matchesByDay[a].dayIndex - matchesByDay[b].dayIndex
    })
    
    // החזר אובייקט ממוין
    const sortedMatchesByDay = {}
    sortedDays.forEach(day => {
      sortedMatchesByDay[day] = matchesByDay[day].matches
    })
    
    return sortedMatchesByDay
  }

  const matchesByDay = getMatchesByDay()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100" dir="rtl">
      <div className="relative z-10">
        {/* פס קופה קטן בין הניווט לכותרת */}
        <div className="max-w-6xl mx-auto px-0 mt-3">
          <div className="bg-white rounded-none border-0 shadow-none py-3 px-4 text-sm flex items-center justify-between" dir="rtl">                                                                                   
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">                                                                                       
                <Gift className="w-4 h-4 text-white" />
              </div>
              <span className="text-blue-800 font-bold">הקופה השבועית</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-blue-900">₪{pot.totalAmount.toLocaleString()}</span>
              <span className="text-xs text-gray-600">{pot.numOfPlayers} משתתפים × ₪{pot.amountPerPlayer}</span>                                                                                                       
            </div>
          </div>
          {/* פרס ראשון בטוטו */}
          <div className="bg-red-50 rounded-none border-0 shadow-none py-3 px-4 text-sm flex items-center justify-between" dir="rtl">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <span className="text-red-800 font-bold">פרס ראשון בטוטו</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-red-900">₪{(settings.totoFirstPrize || 8000000).toLocaleString()}</span>
              <span className="text-xs text-gray-600">{pot.numOfPlayers} משתתפים</span>
              <span className="text-xs text-gray-600">₪{pot.numOfPlayers > 0 ? ((settings.totoFirstPrize || 8000000) / pot.numOfPlayers).toLocaleString('he-IL', { maximumFractionDigits: 2 }) : '0'} למשתתף</span>
            </div>
          </div>
        </div>
        {/* כותרת עליונה */}
        <header className="bg-white/80 backdrop-blur border-b border-gray-200 shadow-md rounded-lg mb-6">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-blue-800">טוטו שלוש</h1>
                  <p className="text-base text-gray-600">המקום לזכות בגדול</p>
                </div>
              </div>
              <nav className="flex gap-3">
                <button onClick={refreshData} disabled={isRefreshing} className="btn btn-primary flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                  <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'מרענן...' : 'רענן'}
                </button>
              </nav>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          {/* שעון רץ */}
          {countdown.active && (
            <div className="card mb-4">
              <div className="card-content text-center bg-blue-50 rounded">
                <h3 className="text-2xl font-bold text-blue-900 mb-2">סגירת הגשת הטפסים בעוד</h3>
                <div className="flex justify-center gap-6 text-4xl font-extrabold text-700">
                  <div><div>{String(countdown.s).padStart(2,'0')}</div><div className="text-sm font-normal">שניות</div></div>
                  <div><div>{String(countdown.m).padStart(2,'0')}</div><div className="text-sm font-normal">דקות</div></div>
                  <div><div>{String(countdown.h).padStart(2,'0')}</div><div className="text-sm font-normal">שעות</div></div>
                  <div><div>{String(countdown.d).padStart(2,'0')}</div><div className="text-sm font-normal">ימים</div></div>
                </div>
                <div className="text-sm text-gray-600 mt-2"> {}</div>
              </div>
            </div>
          )}
          {/* טבלת דירוג מהירה */}
          {leaderboard.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-xl font-bold text-blue-800 flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  מובילי המחזור
                </h3>
              </div>
              <div className="card-content">
                <div className="space-y-3">
                  {leaderboard.slice(0, 5).map((entry, index) => {
                    const isTop = topScore !== null && entry.score === topScore
                    return (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-2 rounded-md ${
                        isTop ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white ${
                          isTop ? 'bg-green-600' :
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
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">{entry.score}</div>
                        <div className="text-xs text-gray-500">נקודות</div>
                      </div>
                      {false && (
                        <div className="mt-2">
                          {/* הוסתר: הצ'יפים האדומים/ירוקים של ניחושים לכל משתמש */}
                          {entry.guesses.map((guess, i) => (
                            <span
                              key={i}
                              className={`inline-block px-2 py-1 rounded-full text-white text-xs font-bold ${
                                guess.correct ? 'bg-green-500' : 'bg-red-500'
                              }`}
                            >
                              {guess.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    )})}
                </div>
                
                {leaderboard.length > 5 && (
                  <div className="text-center mt-4">
                    <Link href="/leaderboard" className="btn btn-secondary">
                      צפה בכל הדירוג
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        {/* משחקי השבוע */}
          {matches.length > 0 ? (
            <div className="card">
              <div className="card-header">
                <h3 className="text-xl font-bold text-blue-800 flex items-center gap-2">
                  <Calendar className="w-6 h-6" />
                  משחקי השבוע
                </h3>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {Object.keys(matchesByDay).length > 0 ? (
                    Object.entries(matchesByDay).map(([dayName, dayMatches]) => (
                      <div key={dayName} className="space-y-2">
                        <h4 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-1">
                          יום {dayName} ({dayMatches.length} משחקים):
                        </h4>
                        <div className="space-y-2">
                          {dayMatches.map((match, index) => (
                            <div key={match.id || index} className={`flex items-center justify-between p-3 rounded-lg ${
                              match.result ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                            }`}>
                              <div className="flex-1">
                                <div className="font-medium text-gray-800 flex items-center gap-2">
                                  {match.result && <CheckCircle className="w-4 h-4 text-green-500" />}
                                  {match.homeTeam} vs {match.awayTeam}
                                </div>
                                {match.result && (
                                  <div className="text-sm text-green-600 font-bold flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    תוצאה: {match.result === '1' ? '1' : match.result === 'X' ? 'X' : '2'}
                                  </div>
                                )}
                                {!match.result && (
                                  <div className="text-sm text-gray-500">
                                    עדיין לא נקבעה תוצאה
                                  </div>
                                )}
                              </div>
                              <div className="text-left text-sm text-gray-600">
                                {match.time && (
                                  <div className="font-medium">{match.time}</div>
                                )}
                                {match.date && (
                                  <div className="text-xs">
                                    {new Date(match.date).toLocaleDateString('he-IL', { 
                                      day: '2-digit', 
                                      month: '2-digit', 
                                      year: 'numeric' 
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      אין משחקים מוגדרים לשבוע זה
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h3 className="text-xl font-bold text-blue-800 flex items-center gap-2">
                  <Calendar className="w-6 h-6" />
                  משחקי השבוע
                </h3>
              </div>
              <div className="card-content">
                <div className="text-center text-gray-500 py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">אין משחקים מוגדרים לשבוע זה</p>
                  <p className="text-sm mt-2">המנהל עדיין לא העלה את המשחקים</p>
                </div>
              </div>
            </div>
          )}

        {/* הקופה השבועית הועברה לפס העליון הקטן */}

          {/* כפתורי פעולה */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Link href="/guess" className="group">
              <div className="card hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <div className="card-content text-center">
                  <Target className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-blue-800 mb-2">מלא טופס</h3>
                  <p className="text-gray-600 mb-4">הזן את הניחושים שלך ל-16 המשחקים</p>
                  <div className="btn btn-primary w-full text-lg py-3">
                    התחל לנחש! 🎯
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/leaderboard" className="group">
              <div className="card hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <div className="card-content text-center">
                  <Star className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-blue-800 mb-2">טבלת דירוג</h3>
                  <p className="text-gray-600 mb-4">ראה מי מוביל בתחרות</p>
                  <div className="btn btn-secondary w-full text-lg py-3">
                    צפה בדירוג! 🏆
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </main>

        {/* כותרת תחתונה */}
        <footer className="bg-gradient-to-r from-blue-800 to-blue-900 text-white py-8 mt-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-blue-200 text-sm mt-3">טוטו שלוש! כל הזכויות שמורות © {new Date().getFullYear()}</p>
            <div className="flex justify-center gap-4 mt-4 text-2xl">
              <span>⚽</span>
              <span>🏆</span>
              <span>💰</span>
              <span>🎯</span>
            </div>
            <p className="text-blue-200 text-sm mt-3">תיהנו ובהצלחה!</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
