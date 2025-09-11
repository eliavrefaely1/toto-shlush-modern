'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Settings, Users, Trophy, Plus, Save, Eye, EyeOff, ArrowLeft, Edit, Trash2, CheckCircle } from 'lucide-react';
import dataManager from '../lib/data.js';

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('matches');
  const [isLoading, setIsLoading] = useState(false);

  const [settings, setSettings] = useState({ currentWeek: 1, adminPassword: '1234', entryFee: 35 });
  const [matches, setMatches] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [pot, setPot] = useState({ totalAmount: 0, numOfPlayers: 0 });

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated]);

  const deleteMatch = (matchId) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את המשחק?')) {
      dataManager.deleteMatch(matchId);
      setMatches(dataManager.getMatches());
    }
  };

  const clearAllMatches = () => {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל המשחקים?')) {
      dataManager.clearAllMatches();
      setMatches([]);
    }
  };

  const loadAdminData = () => {
    setIsLoading(true);
    try {
      const currentSettings = dataManager.getSettings();
      const currentMatches = dataManager.getMatches();
      const currentParticipants = dataManager.getUsers();
      const currentLeaderboard = dataManager.getLeaderboard();
      const currentPot = dataManager.getPot();

      setSettings(currentSettings);
      setMatches(currentMatches);
      setParticipants(currentParticipants);
      setLeaderboard(currentLeaderboard);
      setPot(currentPot);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
    setIsLoading(false);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (dataManager.authenticateAdmin(password)) {
      setIsAuthenticated(true);
    } else {
      alert('סיסמה שגויה!');
    }
  };

  const updateMatch = (matchId, field, value) => {
    const updatedMatch = dataManager.updateMatch(matchId, { [field]: value });
    if (updatedMatch) {
      setMatches((prev) => prev.map((m) => (m.id === matchId ? updatedMatch : m)));
      if (field === 'result') {
        dataManager.calculateScores();
        setLeaderboard(dataManager.getLeaderboard());
      }
    }
  };

  const updateSettings = (newSettings) => {
    dataManager.updateSettings(newSettings);
    setSettings({ ...settings, ...newSettings });
    if (newSettings.currentWeek && newSettings.currentWeek !== settings.currentWeek) {
      loadAdminData();
    }
  };

  const createDefaultMatches = () => {
    const newMatches = dataManager.createDefaultMatches();
    setMatches(newMatches);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-100">
        <div className="card max-w-md mx-auto">
          <div className="card-content">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-red-800 mb-2">כניסת מנהל</h2>
              <p className="text-red-600">הזן את סיסמת המנהל</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-red-700 mb-2">סיסמת מנהל</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
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
                    {showPassword ? <EyeOff className="w-4 h-4 text-red-500" /> : <Eye className="w-4 h-4 text-red-500" />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-danger w-full py-3 text-lg font-bold">
                <Shield className="w-5 h-5 ml-2" /> כניסה
              </button>
            </form>
            <div className="mt-6 p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700 text-center">🔒 סיסמת ברירת מחדל: 1234</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-red-600 text-lg">טוען פאנל מנהל...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold text-red-800">פאנל מנהל</h1>
          </div>
          <p className="text-lg text-red-600">ניהול משחקים, תוצאות ומשתתפים</p>
        </div>
        <div className="mb-6">
          <button onClick={() => router.push('/')} className="btn btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> חזרה לדף הבית
          </button>
        </div>
        <div className="card mb-6">
          <div className="card-content p-0">
            <div className="flex border-b">
              {[
                { id: 'matches', label: 'משחקים', icon: Trophy },
                { id: 'results', label: 'תוצאות', icon: Users },
                { id: 'participants', label: 'משתתפים', icon: Users },
                { id: 'settings', label: 'הגדרות', icon: Settings },
              ].map((tab) => (
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
        {activeTab === 'matches' && (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">משחקי שבוע {settings.currentWeek}</h2>
                  <button onClick={createDefaultMatches} className="btn btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" /> יצירת 16 משחקים
                  </button>
                </div>
              </div>
              <div className="card-content">
                {matches.length === 0 ? (
                  <p className="text-center text-gray-500">אין משחקים זמינים</p>
                ) : (
                  <ul>
                    {matches.map((match) => (
                      <li key={match.id}>{match.name}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
