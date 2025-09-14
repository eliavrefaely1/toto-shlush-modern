'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Users, Star, Target, Gift, RefreshCw } from 'lucide-react'
import dataManager from './lib/data.js'

export default function Home() {
  const router = useRouter()
  const [pot, setPot] = useState({ totalAmount: 0, numOfPlayers: 0 })
  const [leaderboard, setLeaderboard] = useState([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const init = async () => {
      await dataManager.syncFromServer()
      const currentPot = dataManager.getPot()
      const currentLeaderboard = dataManager.getLeaderboard()
      setPot(currentPot)
      setLeaderboard(currentLeaderboard)
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
      await dataManager.syncFromServer()
      setPot(dataManager.getPot())
      setLeaderboard(dataManager.getLeaderboard())
    } finally {
      // ריענון מלא כמו F5
      if (typeof window !== 'undefined') {
        window.location.reload()
      } else {
        router.refresh()
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100" dir="rtl">
      <div className="relative z-10">
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
                  {leaderboard.slice(0, 5).map((entry, index) => (
                    <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0 ? 'bg-blue-600' :
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
                  ))}
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

          {/* קופה שבועית */}
          <div className="card shadow-md rounded-lg">
            <div className="card-header">
              <h3 className="text-xl font-bold text-blue-800 flex items-center gap-2">
                <Gift className="w-6 h-6 text-gray-600" />
                הקופה השבועית
              </h3>
            </div>
            <div className="card-content bg-white rounded-b-lg">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-800">
                <div className="text-4xl font-bold mb-2">
                  ₪{pot.totalAmount.toLocaleString()}
                </div>
                <p className="text-lg">
                  {pot.numOfPlayers} משתתפים × ₪{pot.amountPerPlayer}
                </p>
              </div>
            </div>
          </div>

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
