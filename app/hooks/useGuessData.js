'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { dataManager } from '../../src/lib/data-manager';

export const useGuessData = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', guesses: Array(16).fill('') });
  const [matches, setMatches] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    // טעינת משחקים מהשרת
    (async () => {
      await dataManager.initialize();
      const currentMatches = await dataManager.getMatches();
      setMatches(currentMatches);
      const s = await dataManager.getSettings();
      setIsLocked(!!s.submissionsLocked);
    })();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGuessChange = (matchIndex, guess) => {
    const newGuesses = [...formData.guesses];
    newGuesses[matchIndex] = guess;
    setFormData(prev => ({
      ...prev,
      guesses: newGuesses
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // בדיקת מצב נעילה מהשרת ברגע השליחה
    await dataManager.initialize();
    const sNow = await dataManager.getSettings();
    if (sNow.submissionsLocked) {
      setIsLocked(true);
      alert('ההגשה סגורה כרגע. נסו מאוחר יותר.');
      return;
    }
    
    if (!formData.name.trim()) {
      alert('אנא מלא את שמך המלא');
      return;
    }

    const filledGuesses = formData.guesses.filter(g => g !== '').length;
    if (filledGuesses < 16) {
      if (!confirm(`מילאת רק ${filledGuesses} ניחושים מתוך 16. האם אתה בטוח שברצונך לשלוח?`)) {
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // יצירת משתמש אם לא קיים
      let users = await dataManager.getUsers();
      let user = users.find(u => (u.name||'').toLowerCase().trim() === formData.name.toLowerCase().trim());
      if (!user) {
        user = await dataManager.addUser({
          name: formData.name
        });
      }

      // שמירת הניחושים
      console.log('💾 Adding user guess for:', formData.name);
      await dataManager.addUserGuess({ userId: user.id, name: formData.name, guesses: formData.guesses });
      console.log('✅ User guess added successfully');

      setShowSuccess(true);
      
      // הגדר flag לעדכון הדירוג
      sessionStorage.setItem('shouldRefreshLeaderboard', 'true');
      
      // עדכון מיידי של הדירוג
      try {
        console.log('🔄 Calculating scores...');
        await dataManager.calculateScores();
        console.log('✅ Scores calculated successfully');
      } catch (error) {
        console.error('Error calculating scores:', error);
      }
      
      setTimeout(() => {
        router.push('/leaderboard');
      }, 3000);

    } catch (error) {
      console.error('Error saving guesses:', error);
      alert('שגיאה בשמירת הניחושים. אנא נסה שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextMatch = () => {
    if (currentMatchIndex < matches.length - 1) {
      setCurrentMatchIndex(currentMatchIndex + 1);
    }
  };

  const prevMatch = () => {
    if (currentMatchIndex > 0) {
      setCurrentMatchIndex(currentMatchIndex - 1);
    }
  };

  // ניווט באמצעות החיצים במקלדת
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') nextMatch();
      if (e.key === 'ArrowRight') prevMatch();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentMatchIndex, matches.length]);

  const getProgress = () => {
    const filled = formData.guesses.filter(g => g !== '').length;
    return (filled / 16) * 100;
  };

  return {
    formData,
    matches,
    isSubmitting,
    currentMatchIndex,
    showSuccess,
    isLocked,
    handleInputChange,
    handleGuessChange,
    handleSubmit,
    nextMatch,
    prevMatch,
    setCurrentMatchIndex,
    getProgress
  };
};
