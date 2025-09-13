'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Target, Save, ArrowRight, ArrowLeft, CheckCircle, RefreshCw } from 'lucide-react'
import dataManager from '../lib/data.js'

export default function GuessPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ name: '', guesses: Array(16).fill('') })
  const [matches, setMatches] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLocked, setIsLocked] = useState(false)

  useEffect(() => {
    // טעינת משחקים + שם מהאחסון המקומי
    (async () => {
      await dataManager.syncFromServer()
      const currentMatches = dataManager.getMatches()
      setMatches(currentMatches)
      const storedName = localStorage.getItem('toto-current-name') || ''
      if (storedName) {
        setFormData(prev => ({ ...prev, name: storedName }))
        // טעינת ניחוש קיים לשבוע הנוכחי עבור אותו שם
        const existing = (dataManager.getUserGuesses() || []).find(
          g => (g.name || '').toLowerCase().trim() === storedName.toLowerCase().trim()
        )
        if (existing && Array.isArray(existing.guesses)) {
          setFormData(prev => ({ ...prev, guesses: existing.guesses }))
        }
      }
      const s = dataManager.getSettings()
      setIsLocked(!!s.submissionsLocked)
    })()
  }, [])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleGuessChange = (matchIndex, guess) => {
    const newGuesses = [...formData.guesses]
    newGuesses[matchIndex] = guess
    setFormData(prev => ({
      ...prev,
      guesses: newGuesses
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // בדיקת מצב נעילה מהשרת ברגע השליחה
    await dataManager.syncFromServer()
    const sNow = dataManager.getSettings()
    if (sNow.submissionsLocked) {
      setIsLocked(true)
      alert('ההגשה סגורה כרגע. נסו מאוחר יותר.')
      return
    }
    
    if (!formData.name.trim()) {
      alert('אנא מלא את שמך המלא')
      return
    }

    const filledGuesses = formData.guesses.filter(g => g !== '').length
    if (filledGuesses < 16) {
      if (!confirm(`מילאת רק ${filledGuesses} ניחושים מתוך 16. האם אתה בטוח שברצונך לשלוח?`)) {
        return
      }
    }

    setIsSubmitting(true)

    try {
      // יצירת משתמש אם לא קיים
      let user = dataManager.getUsers().find(u => (u.name||'').toLowerCase().trim() === formData.name.toLowerCase().trim())
      if (!user) {
        user = dataManager.addUser({
          name: formData.name
        })
      }
      localStorage.setItem('toto-current-name', formData.name)

      // שמירת הניחושים
      dataManager.addUserGuess({ userId: user.id, name: formData.name, guesses: formData.guesses })

      setShowSuccess(true)
      
      setTimeout(() => {
        router.push('/leaderboard')
      }, 3000)

    } catch (error) {
      console.error('Error submitting guess:', error)
      alert('שגיאה בשמירת הניחושים. אנא נסה שוב.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextMatch = () => {
    if (currentMatchIndex < matches.length - 1) {
      setCurrentMatchIndex(currentMatchIndex + 1)
    }
  }

  const prevMatch = () => {
    if (currentMatchIndex > 0) {
      setCurrentMatchIndex(currentMatchIndex - 1)
    }
  }

  // ניווט באמצעות החיצים במקלדת
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') nextMatch()
      if (e.key === 'ArrowRight') prevMatch()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentMatchIndex, matches.length])

  const getProgress = () => {
    const filled = formData.guesses.filter(g => g !== '').length
    return (filled / 16) * 100
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100">
        <div className="card max-w-md mx-auto text-center">
          <div className="card-content">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-green-800 mb-4">הניחושים נשמרו! 🎉</h2>
            <p className="text-lg text-gray-600 mb-6">
              תודה {formData.name}! הניחושים שלך נשמרו בהצלחה.
            </p>
            <p className="text-sm text-gray-500">
              מעביר אותך לטבלת הדירוג...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100" dir="rtl">
      <div className="relative z-10">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <button onClick={() => router.push('/')} className="btn btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            חזרה לדף הבית
          </button>
        </div>
        {/* כותרת */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Target className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-blue-800">מלא את הניחושים שלך</h1>
          </div>
          <p className="text-lg text-gray-600">בחר 1, X או 2 לכל משחק</p>
        </div>

        {/* התקדמות */}
        <div className="card mb-6">
          <div className="card-content">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">התקדמות</span>
              <span className="text-sm font-medium text-gray-700">
                {formData.guesses.filter(g => g !== '').length} / 16
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgress()}%` }}
              ></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* פרטים אישיים */}
          <div className="card mb-6">
            <div className="card-header">
                  <h2 className="text-xl font-bold text-blue-800">פרטים אישיים</h2>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">שם מלא *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="input"
                    placeholder="הזן את שמך"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ניחושים */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-xl font-bold text-blue-800">ניחושים</h2>
              <p className="text-gray-600">משחק {currentMatchIndex + 1} מתוך 16</p>
            </div>
            <div className="card-content">
              {matches.length > 0 && (
                <div className="space-y-6">
                  {/* משחק נוכחי */}
                  <div className="text-center">
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        משחק {currentMatchIndex + 1}
                      </h3>
                      <div className="text-2xl font-bold text-green-700 mb-4">
                        {matches[currentMatchIndex]?.homeTeam} vs {matches[currentMatchIndex]?.awayTeam}
                      </div>
                      
                      <div className="flex justify-center gap-4">
                        {['1', 'X', '2'].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleGuessChange(currentMatchIndex, option)}
                            className={`w-16 h-16 rounded-full text-2xl font-bold transition-all ${
                              formData.guesses[currentMatchIndex] === option
                                ? 'bg-blue-500 text-white shadow-lg scale-110'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ניווט בין משחקים */}
                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={prevMatch}
                        disabled={currentMatchIndex === 0}
                        className="btn btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowRight className="w-4 h-4" />
                        משחק קודם
                      </button>
                      
                      <button
                        type="button"
                        onClick={nextMatch}
                        disabled={currentMatchIndex === matches.length - 1}
                        className="btn btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        משחק הבא
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* סיכום ניחושים */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-gray-800 mb-3">סיכום הניחושים שלך:</h4>
                    <div className="grid grid-cols-8 gap-2">
                      {formData.guesses.map((guess, index) => (
                        <button
                          type="button"
                          key={index}
                          onClick={() => setCurrentMatchIndex(index)}
                          className={`text-center p-2 rounded transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                            index === currentMatchIndex
                              ? 'bg-green-200 border-2 border-green-500'
                              : guess
                              ? 'bg-green-100 hover:bg-green-200'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                          aria-label={`נווט למשחק ${index + 1}`}
                        >
                          <div className="text-xs text-gray-600">{index + 1}</div>
                          <div className="text-lg font-bold">{guess || '?'}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* כפתור שליחה */}
          <div className="text-center">
            <button
              type="submit"
              disabled={isSubmitting || isLocked}
              className="btn btn-primary text-xl py-4 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  שומר...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-5 h-5" />
                  {isLocked ? 'ההגשה סגורה' : 'שלח ניחושים'}
                </div>
              )}
            </button>
          </div>
        </form>
        {isLocked && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-center">
            ההגשה סגורה כעת על ידי המנהל. ניתן לעיין במשחקים ולערוך טיוטה, אך לא לשלוח.
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
