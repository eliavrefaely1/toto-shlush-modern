'use client';

import { ArrowRight, ArrowLeft, Shuffle } from 'lucide-react';

const GuessForm = ({ 
  matches, 
  currentMatchIndex, 
  formData, 
  handleGuessChange, 
  setCurrentMatchIndex,
  nextMatch,
  prevMatch,
  fillRandomGuesses 
}) => {
  if (matches.length === 0) return null;

  return (
    <div className="card mb-6">
      <div className="card-header">
        <h2 className="text-xl font-bold text-blue-800">ניחושים</h2>
        <p className="text-gray-700 text-right text-lg font-bold">משחק {currentMatchIndex + 1} מתוך 16</p>
      </div>
      <div className="card-content">
        <div className="space-y-6">
          {/* משחק נוכחי */}
          <div className="text-center">
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="text-sm font-bold text-gray-600 mb-2 text-center">
                <span>{matches[currentMatchIndex]?.league || 'ליגה'}</span>
                <br />
                <span>יום {matches[currentMatchIndex]?.day || 'יום'}</span> 
                <span> - </span> 
                <span>{matches[currentMatchIndex]?.time || 'שעה'}</span> 
              </div>
              <div className="text-xl font-bold text-blue-900 mb-6 text-center">
                {matches[currentMatchIndex]?.homeTeam || 'קבוצה בית'} VS {matches[currentMatchIndex]?.awayTeam || 'קבוצה חוץ'}
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

            {/* כפתור מילוי רנדומלי */}
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={fillRandomGuesses}
                className="btn bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-2 shadow-md transition-all"
              >
                <Shuffle className="w-4 h-4" />
                מילוי אוטומטי (רנדומלי)
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
      </div>
    </div>
  );
};

export default GuessForm;
