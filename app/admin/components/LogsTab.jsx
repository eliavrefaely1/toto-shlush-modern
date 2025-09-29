'use client';

import { useState, useEffect } from 'react';
import { Clock, User, Database, Trash2, Filter, Download } from 'lucide-react';

const LogsTab = () => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    entityType: '',
    action: '',
    actor: '',
    startDate: '',
    endDate: '',
    limit: 50
  });

  const loadEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/events?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.events);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [filters]);

  const clearEvents = async (clearOld = false) => {
    if (!confirm(clearOld ? 'למחוק אירועים ישנים (לשמור אחרונים 500)?' : 'למחוק את כל האירועים?')) {
      return;
    }

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear', clearOld, keepCount: 500 })
      });
      
      const result = await response.json();
      if (result.success) {
        loadEvents();
        alert(result.message);
      }
    } catch (error) {
      console.error('Error clearing events:', error);
    }
  };

  const exportEvents = async () => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export' })
      });
      
      const result = await response.json();
      if (result.success) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `events-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting events:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('he-IL');
  };

  const getActionColor = (action) => {
    const colors = {
      create: 'text-green-600 bg-green-50',
      update: 'text-blue-600 bg-blue-50',
      delete: 'text-red-600 bg-red-50',
      login: 'text-purple-600 bg-purple-50',
      logout: 'text-gray-600 bg-gray-50'
    };
    return colors[action] || 'text-gray-600 bg-gray-50';
  };

  const getEntityIcon = (entityType) => {
    const icons = {
      match: '⚽',
      user: '👤',
      guess: '🎯',
      settings: '⚙️',
      backup: '💾'
    };
    return icons[entityType] || '📄';
  };

  return (
    <div className="space-y-6">
      <div className="card shadow-lg">
        <div className="card-header bg-gradient-to-r from-purple-50 to-purple-100">
          <h2 className="text-xl font-bold text-purple-800">לוג אירועים</h2>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-gray-600">מעקב אחר פעולות במערכת</p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => clearEvents(true)}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> נקה ישנים
              </button>
              <button 
                onClick={() => clearEvents(false)}
                className="btn btn-danger flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> נקה הכל
              </button>
              <button 
                onClick={exportEvents}
                className="btn btn-primary flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> ייצא
              </button>
            </div>
          </div>
        </div>
        
        <div className="card-content">
          {/* Statistics */}
          {stats && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-bold text-gray-800 mb-3">סטטיסטיקות</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalEvents}</div>
                  <div className="text-sm text-gray-600">סה"כ אירועים</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{Object.keys(stats.byAction).length}</div>
                  <div className="text-sm text-gray-600">סוגי פעולות</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{Object.keys(stats.byEntityType).length}</div>
                  <div className="text-sm text-gray-600">סוגי ישויות</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{Object.keys(stats.byActor).length}</div>
                  <div className="text-sm text-gray-600">משתמשים פעילים</div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" /> פילטרים
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סוג ישות</label>
                <select 
                  value={filters.entityType}
                  onChange={(e) => setFilters(prev => ({ ...prev, entityType: e.target.value }))}
                  className="input w-full"
                >
                  <option value="">הכל</option>
                  <option value="match">משחק</option>
                  <option value="user">משתמש</option>
                  <option value="guess">ניחוש</option>
                  <option value="settings">הגדרות</option>
                  <option value="backup">גיבוי</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">פעולה</label>
                <select 
                  value={filters.action}
                  onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                  className="input w-full"
                >
                  <option value="">הכל</option>
                  <option value="create">יצירה</option>
                  <option value="update">עדכון</option>
                  <option value="delete">מחיקה</option>
                  <option value="login">כניסה</option>
                  <option value="logout">יציאה</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">משתמש</label>
                <input
                  type="text"
                  value={filters.actor}
                  onChange={(e) => setFilters(prev => ({ ...prev, actor: e.target.value }))}
                  placeholder="שם משתמש"
                  className="input w-full"
                />
              </div>
            </div>
          </div>

          {/* Events List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">טוען אירועים...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">אין אירועים להצגה</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getEntityIcon(event.entityType)}</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(event.action)}`}>
                            {event.action}
                          </span>
                          <span className="text-sm text-gray-600">{event.entityType}</span>
                          <span className="text-sm font-mono text-gray-500">#{event.entityId}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-3 h-3" />
                          <span>{event.actor}</span>
                          <Clock className="w-3 h-3" />
                          <span>{formatTimestamp(event.timestamp)}</span>
                        </div>
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            {Object.entries(event.metadata).map(([key, value]) => (
                              <span key={key} className="mr-2">
                                <strong>{key}:</strong> {String(value)}
                              </span>
                            ))}
                          </div>
                        )}
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
  );
};

export default LogsTab;
