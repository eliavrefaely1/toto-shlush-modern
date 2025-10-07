'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
      try {
        const response = await fetch('/api/data?legacy=true', { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        const data = await response.json();
        setMatches(data.matches || []);
        setIsLocked(!!data.settings?.submissionsLocked);
      } catch (error) {
        console.error('Error loading matches:', error);
        setMatches([]);
      }
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
      console.log('🎯 Client: Submitting guess for:', formData.name);
      
      // השתמש ב-API route שירוץ בצד השרת עם גישה ל-Vercel KV
      const response = await fetch('/api/add-guess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          guesses: formData.guesses
        }),
      });

      console.log(`📡 Client: API response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Client: API error:', errorData);
        
        if (response.status === 403) {
          alert('ההגשה סגורה כרגע. נסו מאוחר יותר.');
          setIsLocked(true);
          return;
        }
        
        throw new Error('Failed to submit guess');
      }

      const result = await response.json();
      console.log(`✅ Client: Guess submitted successfully:`, result);

      setShowSuccess(true);
      
      // הגדר flag לעדכון הדירוג
      sessionStorage.setItem('shouldRefreshLeaderboard', 'true');
      
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

  const fillRandomGuesses = () => {
    const options = ['1', 'X', '2'];
    const randomGuesses = Array(16).fill('').map(() => 
      options[Math.floor(Math.random() * options.length)]
    );
    setFormData(prev => ({
      ...prev,
      guesses: randomGuesses
    }));
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
    getProgress,
    fillRandomGuesses
  };
};
