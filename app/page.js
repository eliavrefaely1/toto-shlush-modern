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

    // משפט מוטיבציה
    const quotes = [
      "לטוטו שלוש הגעת – את הקופה כמעט לקחת! 🎯",
      "מי שלא מנחש הרבה, יצאת עגל! 🐄",
      "הכסף קורא לך - תענה! 💰",
      "עוד משחק אחד נכון ואתה במקום הראשון! 🏆",
      "הקופה מחכה לזוכה החכם! 💼",
      "טוטו זה לא מזל, זה כישרון! ⚽",
      "16 נכונים = הקופה שלך! 🎉",
      "כל ניחוש נכון = צעד לקופה! 👑"
    ]
    
    setMotivationalQuote(quotes[Math.floor(Math.random() * quotes.length)])
  }, [])

  const getScoreMessage = (score) => {
    if (score >= 16) return "טוטו שלוש הגעת – את הקופה כמעט לקחת! 🎯"
    if (score >= 12) return "מעולה! אתה בדרך הנכונה! 🚀"
    if (score >= 8) return "לא רע בכלל! עוד קצת ואתה שם! 💪"
    if (score >= 4) return "יש לך פוטנציאל! תמשיך לנסות! 🎯"
    return "יצאת עגל! אבל יש לך עוד הזדמנויות! 🐄"
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden" dir="rtl">
      {/* רקע עם אלמנטים צפים */}
      <div className="football-bg absolute inset-0" />
      <div className="money-floating" style={{top: '10%', left: '5%', animationDelay: '0s'}}>💰</div>
      <div className="money-floating" style={{top: '20%', right: '10%', animationDelay: '2s'}}>💵</div>
      <div className="money-floating" style={{top: '60%', left: '15%', animationDelay: '4s'}}>💷</div>
      <div className="money-floating" style={{top: '40%', right: '5%', animationDelay: '1s'}}>💶</div>
      <div className="money-floating" style={{top: '80%', left: '25%', animationDelay: '3s'}}>⚽</div>

      <div className="relative z-10">
        {/* כותרת עליונה */}
        <header className="bg-white/90 backdrop-blur-md border-b border-green-200 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-green-800">טוטו החברים</h1>
                  <p className="text-sm text-green-600">המקום לזכות בגדול! 💰</p>
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
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-2xl shadow-xl mb-8 text-center">
            <div className="text-4xl mb-3">🎪</div>
            <p className="text-white font-bold text-xl animate-pulse">
              {motivationalQuote}
            </p>
          </div>

          {/* קופה שבועית */}
          <div className="card mb-8">
            <div className="card-header">
              <h2 className="text-2xl font-bold text-center text-green-800 flex items-center justify-center gap-3">
                <Gift className="w-8 h-8" />
                הקופה השבועית
              </h2>
            </div>
            <div className="card-content">
              <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-2xl p-6 text-center text-white">
                <div className="text-6xl font-bold mb-2">
                  ₪{pot.totalAmount.toLocaleString()}
                </div>
                <p className="text-xl opacity-90">
                  {pot.numOfPlayers} משתתפים × ₪{pot.amountPerPlayer}
                </p>
                <div className="flex justify-center gap-3 mt-4">
                  <span className="text-3xl">💰</span>
                  <span className="text-3xl">💵</span>
                  <span className="text-3xl">💷</span>
                  <span className="text-3xl">💶</span>
                </div>
                <p className="mt-4 text-lg font-semibold">
                  הזוכה לוקח הכל! 🎯
                </p>
              </div>
            </div>
          </div>

          {/* כפתורי פעולה */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Link href="/guess" className="group">
              <div className="card hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <div className="card-content text-center">
                  <Target className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-green-800 mb-2">מלא טופס</h3>
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
                  <Star className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-green-800 mb-2">טבלת דירוג</h3>
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
                <h3 className="text-xl font-bold text-green-800 flex items-center gap-2">
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
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-500' :
                          'bg-gray-300'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-bold text-lg">{entry.user?.name || entry.name}</div>
                          <div className="text-sm text-gray-500">{entry.user?.phone || entry.phone}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{entry.score}</div>
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
        <footer className="bg-green-800 text-white py-6 mt-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-green-200 text-lg">
              "מי שלא מנחש הרבה, יצאת עגל!" 🐄
            </p>
            <p className="text-green-300 text-sm mt-2">
              טוטו החברים - המקום לזכות בגדול! 💰
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
