'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trophy, Users, Settings, Star, Target, Gift } from 'lucide-react'
import dataManager from './lib/data.js'

export default function Home() {
  const [pot, setPot] = useState({ totalAmount: 0, numOfPlayers: 0 })
  const [leaderboard, setLeaderboard] = useState([])
  const [motivationalQuote, setMotivationalQuote] = useState('')

  useEffect(() => {
    // טעינת נתונים
    const currentPot = dataManager.getPot()
    const currentLeaderboard = dataManager.getLeaderboard()
    
    setPot(currentPot)
    setLeaderboard(currentLeaderboard)

    // משפט מוטיבציה לפי האיפיון
    const quotes = [
      "לטוטו שלוש הגעת – את הקופה כמעט לקחת! 🎯",
      "יצאת עגל – 3 ניחושים השבוע? 🐄",
      "הכסף קורא לך - תענה! 💰",
      "עוד משחק אחד נכון ואתה במקום הראשון! 🏆",
      "הקופה מחכה לזוכה החכם! 💼",
      "טוטו זה לא מזל, זה כישרון! ⚽",
      "16 נכונים = הקופה שלך! 🎉",
      "כל ניחוש נכון = צעד לקופה! 👑",
      "מי שלא מנחש הרבה, יצאת עגל! 🐄",
      "הקופה גדלה - הזמן לנחש! 💵"
    ]
    
    setMotivationalQuote(quotes[Math.floor(Math.random() * quotes.length)])
  }, [])

  const getScoreMessage = (score) => {
    if (score >= 16) return "טוטו שלוש הגעת – את הקופה כמעט לקחת! 🎯"
    if (score >= 12) return "מעולה! אתה בדרך הנכונה! 🚀"
    if (score >= 8) return "לא רע בכלל! עוד קצת ואתה שם! 💪"
    if (score >= 4) return "יש לך פוטנציאל! תמשיך לנסות! 🎯"
    return "יצאת עגל – 3 ניחושים השבוע? 🐄"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100" dir="rtl">
      <div className="relative z-10">
        {/* כותרת עליונה */}
        <header className="bg-white/80 backdrop-blur border-b border-gray-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-blue-800">טוטו שלוש</h1>
                  <p className="text-sm text-gray-600">המקום לזכות בגדול</p>
                </div>
              </div>
              
              <nav className="flex gap-2">
                <Link
                  href="/admin"
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  מנהל
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* משפט מוטיבציה */}
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl shadow mb-8 text-center">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-blue-900 font-bold text-xl">
              {motivationalQuote}
            </p>
          </div>

          {/* קופה שבועית */}
          <div className="card mb-8">
            <div className="card-header">
              <h2 className="text-2xl font-bold text-center text-blue-800 flex items-center justify-center gap-3">
                <Gift className="w-8 h-8" />
                הקופה השבועית
              </h2>
            </div>
            <div className="card-content">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center text-blue-900">
                <div className="text-5xl font-bold mb-2">
                  ₪{pot.totalAmount.toLocaleString()}
                </div>
                <p className="text-lg">
                  {pot.numOfPlayers} משתתפים × ₪{pot.amountPerPlayer}
                </p>
                <p className="mt-4 text-sm text-blue-700">הזוכה לוקח הכל</p>
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

          {/* טבלת דירוג מהירה */}
          {leaderboard.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-xl font-bold text-blue-800 flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  דירוג מהיר
                </h3>
              </div>
              <div className="card-content">
                <div className="space-y-3">
                  {leaderboard.slice(0, 5).map((entry, index) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0 ? 'bg-blue-600' :
                          index === 1 ? 'bg-blue-500' :
                          index === 2 ? 'bg-blue-400' :
                          'bg-blue-300'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-bold text-lg">{entry.user?.name || entry.name}</div>
                          <div className="text-sm text-gray-500">{entry.user?.phone || entry.phone}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{entry.score}</div>
                        <div className="text-sm text-gray-500">נקודות</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {getScoreMessage(entry.score)}
                        </div>
                      </div>
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
