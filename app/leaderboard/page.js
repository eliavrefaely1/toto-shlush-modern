'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trophy, Medal, Star, Target, ArrowLeft, Crown, Award } from 'lucide-react'
import dataManager from '../lib/data.js'

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([])
  const [pot, setPot] = useState({ totalAmount: 0, numOfPlayers: 0 })
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [availableWeeks, setAvailableWeeks] = useState([1])

  useEffect(() => {
    loadData()
  }, [selectedWeek])

  const loadData = () => {
    const currentLeaderboard = dataManager.getLeaderboard(selectedWeek)
    const currentPot = dataManager.getPot(selectedWeek)
    
    setLeaderboard(currentLeaderboard)
    setPot(currentPot)

    // טעינת שבועות זמינים
    const allGuesses = dataManager.data.userGuesses
    const weeks = [...new Set(allGuesses.map(g => g.week))].sort((a, b) => b - a)
    setAvailableWeeks(weeks.length > 0 ? weeks : [1])
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
    return "יצאת עגל! אבל יש לך עוד הזדמנויות! 🐄"
  }

  const getScoreEmoji = (score) => {
    if (score >= 16) return "🏆"
    if (score >= 12) return "🥇"
    if (score >= 8) return "🥈"
    if (score >= 4) return "🥉"
    return "🐄"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* כותרת */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-green-800">טבלת דירוג</h1>
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
          </div>

          {/* קופה */}
          <div className="card mb-8">
            <div className="card-content">
              <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-2xl p-6 text-center text-white">
                <div className="text-5xl font-bold mb-2">
                  ₪{pot.totalAmount.toLocaleString()}
                </div>
                <p className="text-xl opacity-90">
                  {pot.numOfPlayers} משתתפים × ₪{pot.amountPerPlayer}
                </p>
                <div className="flex justify-center gap-3 mt-4">
                  <span className="text-3xl">💰</span>
                  <span className="text-3xl">💵</span>
                  <span className="text-3xl">��</span>
                  <span className="text-3xl">💶</span>
                </div>
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
          <div className="space-y-4">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.id}
                className={`card transition-all duration-300 hover:shadow-xl ${
                  index < 3 ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                <div className="card-content">
                  <div className="flex items-center justify-between">
                    {/* מיקום ושם */}
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl ${getRankColor(index)}`}>
                        {index + 1}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {getRankIcon(index)}
                        <div>
                          <div className="text-2xl font-bold text-gray-800">
                            {entry.user?.name || entry.name}
                          </div>
                          <div className="text-gray-500">
                            {entry.user?.phone || entry.phone}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ניקוד ופרטים */}
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-4xl">{getScoreEmoji(entry.score)}</span>
                        <div>
                          <div className="text-3xl font-bold text-green-600">
                            {entry.score}
                          </div>
                          <div className="text-sm text-gray-500">נקודות</div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 max-w-xs">
                        {getScoreMessage(entry.score)}
                      </div>
                    </div>
                  </div>

                  {/* סרגל התקדמות */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>התקדמות</span>
                      <span>{entry.score} / 16</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${(entry.score / 16) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
  )
}
