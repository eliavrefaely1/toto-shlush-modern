'use client';

import { useState, useEffect } from 'react';

export const useBackupData = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // טעינת רשימת גיבויים
  const loadBackups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/backup?action=list');
      const result = await response.json();
      
      if (result.success) {
        setBackups(result.backups);
      } else {
        setMessage(`שגיאה בטעינת הגיבויים: ${result.error}`);
      }
    } catch (error) {
      setMessage(`שגיאה בטעינת הגיבויים: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // יצירת גיבוי חדש
  const createBackup = async () => {
    try {
      setLoading(true);
      setMessage('יוצר גיבוי...');
      
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create',
          triggerAction: 'Manual backup from backup manager'
        })
      });
      const result = await response.json();
      
      if (result.success) {
        setMessage(`גיבוי נוצר בהצלחה: ${result.timestamp}`);
        loadBackups(); // רענון הרשימה
      } else {
        setMessage(`שגיאה ביצירת גיבוי: ${result.error}`);
      }
    } catch (error) {
      setMessage(`שגיאה ביצירת גיבוי: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // מחיקת גיבוי
  const deleteBackup = async (backupId) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את הגיבוי?`)) {
      return;
    }

    try {
      setLoading(true);
      setMessage('מוחק גיבוי...');
      
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
      });
      const result = await response.json();
      
      if (result.success) {
        setMessage(`גיבוי נמחק בהצלחה`);
        loadBackups(); // רענון הרשימה
      } else {
        setMessage(`שגיאה במחיקת גיבוי: ${result.error}`);
      }
    } catch (error) {
      setMessage(`שגיאה במחיקת גיבוי: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // שחזור מגיבוי
  const restoreBackup = async (backupId) => {
    if (!confirm(`האם אתה בטוח שברצונך לשחזר מגיבוי? פעולה זו תחליף את כל הנתונים הנוכחיים!`)) {
      return;
    }

    try {
      setLoading(true);
      setMessage('משחזר מגיבוי...');
      
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'restore',
          backupId
        })
      });
      const result = await response.json();
      
      if (result.success) {
        setMessage(`גיבוי שוחזר בהצלחה`);
        loadBackups(); // רענון הרשימה
      } else {
        setMessage(`שגיאה בשחזור: ${result.error}`);
      }
    } catch (error) {
      setMessage(`שגיאה בשחזור: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // טעינה ראשונית
  useEffect(() => {
    loadBackups();
  }, []);

  // פורמט גודל קובץ
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // פורמט תאריך
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('he-IL');
  };

  return {
    backups,
    loading,
    message,
    selectedFile,
    setSelectedFile,
    loadBackups,
    createBackup,
    deleteBackup,
    restoreBackup,
    formatFileSize,
    formatDate
  };
};
