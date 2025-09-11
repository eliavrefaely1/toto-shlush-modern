'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Settings, Users, Trophy, Plus, Save, Eye, EyeOff, ArrowLeft, Edit, Trash2, CheckCircle } from 'lucide-react'
import dataManager from '../lib/data.js'

export default function AdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('matches')
  const [isLoading, setIsLoading] = useState(false)
  
  // נתונים
  const [settings, setSettings] = useState({ currentWeek: 1, adminPassword: '1234', entryFee: 35 })
  const [matches, setMatches] = useState([])
  const [participants, setParticipants] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [pot, setPot] = useState({ totalAmount: 0, numOfPlayers: 0 })

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData()
    }
  }, [isAuthenticated])

  
  const deleteMatch = (matchId) => {
    dataManager.deleteMatch(matchId)
    setMatches(dataManager.getMatches())
  }

  const clearAllMatches = () => {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל המשחקים?')) {
      dataManager.clearAllMatches()
      setMatches([])
    }
  }


  const loadAdminData = () => {
    setIsLoading(true)
    
    try {
      const currentSettings = dataManager.getSettings()
      const currentMatches = dataManager.getMatches()
      const currentParticipants = dataManager.getUsers()
      const currentLeaderboard = dataManager.getLeaderboard()
      const currentPot = dataManager.getPot()
      
      setSettings(currentSettings)
      setMatches(currentMatches)
      setParticipants(currentParticipants)
      setLeaderboard(currentLeaderboard)
      setPot(currentPot)
    } catch (error) {
      console.error('Error loading admin data:', error)
    }
    
    setIsLoading(false)
  }

  const handleLogin = (e) => {
    e.preventDefault()
    
    if (dataManager.authenticateAdmin(password)) {
      setIsAuthenticated(true)
    } else {
      alert('סיסמה שגויה!')
    }
  }

  const updateMatch = (matchId, field, value) => {
    const updatedMatch = dataManager.updateMatch(matchId, { [field]: value })
    if (updatedMatch) {
      setMatches(prev => prev.map(m => m.id === matchId ? updatedMatch : m))
      
      // חישוב ניקוד אוטומטי אם עדכנו תוצאה
      if (field === 'result') {
        dataManager.calculateScores()
        setLeaderboard(dataManager.getLeaderboard())
      }
    }
  }

  const updateSettings = (newSettings) => {
    dataManager.updateSettings(newSettings)
    setSettings({ ...settings, ...newSettings })
    
    // אם השבוע השתנה, טען נתונים חדשים
    if (newSettings.currentWeek && newSettings.currentWeek !== settings.currentWeek) {
      loadAdminData()
    }
  }

  const createDefaultMatches = () => {
    const newMatches = dataManager.createDefaultMatches()
    setMatches(newMatches)
  }

  const deleteMatch = (matchId) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את המשחק?')) {
      dataManager.data.matches = dataManager.data.matches.filter(m => m.id !== matchId)
      dataManager.saveData()
      setMatches(dataManager.getMatches())
    }
  }

  if (!isAuthenticated) {
    return (
      <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-100">
        <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="card max-w-md mx-auto">
          <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="card-content">
            <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-center mb-6">
              <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-red-800 mb-2">כניסת מנהל</h2>
              <p className="text-red-600">הזן את סיסמת המנהל</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-red-700 mb-2">
                  סיסמת מנהל
                </label>
                <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="הזן סיסמה"
                    className="input pl-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-3"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-red-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-red-500" />
                    )}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                className="btn btn-danger w-full py-3 text-lg font-bold"
              >
                <Shield className="w-5 h-5 ml-2" />
                כניסה
              </button>
            </form>
            
            <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="mt-6 p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700 text-center">
                🔒 סיסמת ברירת מחדל: 1234
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="min-h-screen flex items-center justify-center">
        <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-center">
          <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-red-600 text-lg">טוען פאנל מנהל...</p>
        </div>
      </div>
    )
  }

  return (
    <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100" dir="rtl">
      <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="max-w-6xl mx-auto px-4 py-8">
        {/* כותרת */}
        <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-center mb-8">
          <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold text-red-800">פאנל מנהל</h1>
          </div>
          <p className="text-lg text-red-600">ניהול משחקים, תוצאות ומשתתפים</p>
        </div>

        {/* כפתור חזרה */}
        <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="btn btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            חזרה לדף הבית
          </button>
        </div>

        {/* טאבים */}
        <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="card mb-6">
          <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="card-content p-0">
            <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="flex border-b">
              {[
                { id: 'matches', label: 'משחקים', icon: Trophy },
                { id: 'results', label: 'תוצאות', icon: Users },
                { id: 'participants', label: 'משתתפים', icon: Users },
                { id: 'settings', label: 'הגדרות', icon: Settings }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 text-center font-medium transition-all flex flex-col items-center justify-center ${
                    activeTab === tab.id
                      ? 'bg-red-500 text-white border-b-2 border-red-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mb-1" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* תוכן טאבים */}
        {activeTab === 'matches' && (
          <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="space-y-6">
            <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="card">
              <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="card-header">
                <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">משחקי שבוע {settings.currentWeek}</h2>
                  <button
                    onClick={createDefaultMatches}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    יצירת 16 משחקים
                  </button>
                </div>
              </div>
              <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="card-content">
                {matches.length === 0 ? (
                  <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-center py-8">
                    <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">אין משחקים עדיין</p>
                    <button
                      onClick={createDefaultMatches}
                      className="btn btn-primary"
                    >
                      יצירת משחקים
                    </button>
                  </div>
                ) : (
                  <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="space-y-4">
                    {matches.map((match, index) => (
                      <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                        <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="flex items-center justify-between mb-3">
                          <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="badge badge-primary">משחק {index + 1}</div>
                          <button
                            onClick={() => deleteMatch(match.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              קבוצת בית
                            </label>
                            <input
                              value={match.homeTeam}
                              onChange={(e) => updateMatch(match.id, 'homeTeam', e.target.value)}
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              קבוצת חוץ
                            </label>
                            <input
                              value={match.awayTeam}
                              onChange={(e) => updateMatch(match.id, 'awayTeam', e.target.value)}
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              תוצאה
                            </label>
                            <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="flex gap-1">
                              {['1', 'X', '2', ''].map((result) => (
                                <button
                                  key={result}
                                  onClick={() => updateMatch(match.id, 'result', result)}
                                  className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-all ${
                                    match.result === result
                                      ? 'bg-red-500 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  {result || 'ללא'}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="card">
            <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="card-header">
              <h2 className="text-xl font-bold">דירוג שבוע {settings.currentWeek}</h2>
            </div>
            <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="card-content">
              {leaderboard.length === 0 ? (
                <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">אין משתתפים עדיין</p>
                </div>
              ) : (
                <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="flex items-center gap-3">
                        <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-500' :
                          'bg-gray-300'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="font-bold text-lg">
                            {entry.user?.name || entry.name}
                          </div>
                          <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-sm text-gray-500">
                            {entry.user?.phone || entry.phone}
                          </div>
                        </div>
                      </div>
                      <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-right">
                        <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-2xl font-bold text-green-600">
                          {entry.score}
                        </div>
                        <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-sm text-gray-500">נקודות</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'participants' && (
          <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="card">
            <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="card-header">
              <h2 className="text-xl font-bold">רשימת משתתפים</h2>
            </div>
            <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="card-content">
              {participants.length === 0 ? (
                <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">אין משתתפים רשומים</p>
                </div>
              ) : (
                <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="space-y-3">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="font-bold text-lg">{participant.name}</div>
                        <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-sm text-gray-500">{participant.phone}</div>
                      </div>
                      <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-right">
                        <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-sm text-gray-500">
                          נרשם: {new Date(participant.createdAt).toLocaleDateString('he-IL')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="card">
            <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="card-header">
              <h2 className="text-xl font-bold">הגדרות מערכת</h2>
            </div>
            <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="card-content">
              <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="space-y-6">
                <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      שבוע נוכחי
                    </label>
                    <input
                      type="number"
                      value={settings.currentWeek}
                      onChange={(e) => updateSettings({ currentWeek: parseInt(e.target.value) || 1 })}
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      דמי כניסה (₪)
                    </label>
                    <input
                      type="number"
                      value={settings.entryFee}
                      onChange={(e) => updateSettings({ entryFee: parseInt(e.target.value) || 35 })}
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      סיסמת מנהל
                    </label>
                    <input
                      type="password"
                      value={settings.adminPassword}
                      onChange={(e) => updateSettings({ adminPassword: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                
                <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-bold mb-3 text-blue-800">סטטיסטיקות:</h4>
                  <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-center">
                      <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-2xl font-bold text-blue-600">{participants.length}</div>
                      <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-blue-700">משתתפים</div>
                    </div>
                    <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-center">
                      <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-2xl font-bold text-blue-600">{leaderboard.length}</div>
                      <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-blue-700">טורים השבוע</div>
                    </div>
                    <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-center">
                      <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-2xl font-bold text-blue-600">₪{pot.totalAmount.toLocaleString()}</div>
                      <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-blue-700">סה״כ קופה</div>
                    </div>
                    <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-center">
                      <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-2xl font-bold text-blue-600">{matches.filter(m => m.result).length}/16</div>
                      <button onClick={clearAllMatches} className="bg-red-600 text-white px-4 py-2 rounded my-2">
  מחק את כל המשחקים
</button>

<div className="text-blue-700">משחקים עם תוצאות</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
