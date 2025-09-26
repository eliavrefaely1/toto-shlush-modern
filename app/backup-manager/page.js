'use client'

import { useState, useEffect } from 'react'

export default function BackupManager() {
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)

  // טעינת רשימת גיבויים
  const loadBackups = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/backup?action=list')
      const result = await response.json()
      
      if (result.success) {
        setBackups(result.backups)
      } else {
        setMessage(`שגיאה בטעינת הגיבויים: ${result.error}`)
      }
    } catch (error) {
      setMessage(`שגיאה בטעינת הגיבויים: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // יצירת גיבוי חדש
  const createBackup = async () => {
    try {
      setLoading(true)
      setMessage('יוצר גיבוי...')
      
      const response = await fetch('/api/backup?action=create', {
        method: 'GET'
      })
      const result = await response.json()
      
      if (result.success) {
        setMessage(`גיבוי נוצר בהצלחה: ${result.timestamp}`)
        loadBackups() // רענון הרשימה
      } else {
        setMessage(`שגיאה ביצירת גיבוי: ${result.error}`)
      }
    } catch (error) {
      setMessage(`שגיאה ביצירת גיבוי: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // מחיקת גיבוי
  const deleteBackup = async (backupId) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את הגיבוי?`)) {
      return
    }

    try {
      setLoading(true)
      setMessage('מוחק גיבוי...')
      
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': prompt('הזן טוקן אדמין:') || ''
        },
        body: JSON.stringify({
          action: 'delete',
          backupId
        })
      })
      const result = await response.json()
      
      if (result.success) {
        setMessage(`גיבוי נמחק בהצלחה`)
        loadBackups() // רענון הרשימה
      } else {
        setMessage(`שגיאה במחיקת גיבוי: ${result.error}`)
      }
    } catch (error) {
      setMessage(`שגיאה במחיקת גיבוי: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // שחזור מגיבוי
  const restoreBackup = async (backupId) => {
    if (!confirm(`האם אתה בטוח שברצונך לשחזר מגיבוי? פעולה זו תחליף את כל הנתונים הנוכחיים!`)) {
      return
    }

    try {
      setLoading(true)
      setMessage('משחזר מגיבוי...')
      
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': prompt('הזן טוקן אדמין:') || ''
        },
        body: JSON.stringify({
          action: 'restore',
          backupId
        })
      })
      const result = await response.json()
      
      if (result.success) {
        setMessage(`גיבוי שוחזר בהצלחה`)
        loadBackups() // רענון הרשימה
      } else {
        setMessage(`שגיאה בשחזור: ${result.error}`)
      }
    } catch (error) {
      setMessage(`שגיאה בשחזור: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // טעינה ראשונית
  useEffect(() => {
    loadBackups()
  }, [])

  // פורמט גודל קובץ
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // פורמט תאריך
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('he-IL')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            מנהל גיבויים
          </h1>

          {/* הודעות */}
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.includes('שגיאה') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {message}
            </div>
          )}

          {/* כפתורי פעולה */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={createBackup}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'יוצר...' : 'צור גיבוי חדש'}
            </button>
            
            <button
              onClick={loadBackups}
              disabled={loading}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              רענן רשימה
            </button>
          </div>

          {/* רשימת גיבויים */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              גיבויים קיימים ({backups.length})
            </h2>

            {loading && backups.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">טוען גיבויים...</p>
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                אין גיבויים זמינים
              </div>
            ) : (
              <div className="space-y-3">
                {backups.map((backup, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          גיבוי {index + 1}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          נוצר: {formatDate(backup.created)}
                        </p>
                        <p className="text-sm text-gray-600">
                          גודל: {formatFileSize(backup.size)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ID: {backup.id}
                        </p>
                        {backup.files && (
                          <div className="text-xs text-gray-500 mt-1">
                            נתונים: {backup.files.mainData ? '✓' : '✗'} ראשי, {backup.files.usersData ? '✓' : '✗'} משתמשים, {backup.files.weeks} שבועות
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => restoreBackup(backup.id)}
                          disabled={loading}
                          className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          שחזר
                        </button>
                        
                        <button
                          onClick={() => deleteBackup(backup.id)}
                          disabled={loading}
                          className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                        >
                          מחק
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* הוראות שימוש */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">הוראות שימוש:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• גיבויים נוצרים אוטומטית כל 5 דקות לאחר שינויים במערכת</li>
              <li>• ניתן ליצור גיבוי ידני בכל עת באמצעות הכפתור "צור גיבוי חדש"</li>
              <li>• הגיבויים נשמרים ב-KV וזמינים גם בפרודקשן</li>
              <li>• המערכת שומרת עד 50 גיבויים אחרונים</li>
              <li>• בדוק תקינות הנתונים לאחר כל שחזור</li>
            </ul>
          </div>

          {/* קישור לחזרה */}
          <div className="mt-6 text-center">
            <a
              href="/admin"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              ← חזרה לדף הניהול
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
