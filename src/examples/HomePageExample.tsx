'use client';

import React from 'react';
import { useHomeData } from '@/hooks/useHomeData';
import ErrorBoundary from '@/components/ErrorBoundary';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ToastProvider } from '@/contexts/ToastContext';

// Example of how to use the new refactored system
const HomePageExample: React.FC = () => {
  const {
    pot,
    leaderboard,
    matches,
    isRefreshing,
    countdown,
    settings,
    topScore,
    matchesByDay,
    refreshData
  } = useHomeData();

  if (isRefreshing) {
    return <LoadingSpinner size="lg" text="טוען נתונים..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Pot Display */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
            הקופה הנוכחית
          </h2>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              ₪{pot.totalAmount.toLocaleString()}
            </div>
            <div className="text-gray-600">
              {pot.numOfPlayers} משתתפים × ₪{pot.amountPerPlayer}
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        {countdown.active && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              זמן נותר להגשת ניחושים
            </h3>
            <div className="flex justify-center gap-4 text-2xl font-bold text-yellow-700">
              <span>{countdown.d} ימים</span>
              <span>{countdown.h} שעות</span>
              <span>{countdown.m} דקות</span>
              <span>{countdown.s} שניות</span>
            </div>
          </div>
        )}

        {/* Leaderboard Preview */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            דירוג נוכחי
          </h2>
          {leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((entry, index) => (
                <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-blue-600">
                      #{index + 1}
                    </span>
                    <span className="font-medium">{entry.name}</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {entry.score} נקודות
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              עדיין אין ניחושים
            </div>
          )}
        </div>

        {/* Matches Preview */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            משחקים השבוע
          </h2>
          {Object.keys(matchesByDay).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(matchesByDay).map(([day, dayMatches]) => (
                <div key={day}>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {day}
                  </h3>
                  <div className="space-y-2">
                    {dayMatches.map((match) => (
                      <div key={match.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-4">
                          <span className="font-medium">{match.homeTeam}</span>
                          <span className="text-gray-400">vs</span>
                          <span className="font-medium">{match.awayTeam}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {match.date} {match.time}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              עדיין אין משחקים
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="btn btn-primary"
          >
            {isRefreshing ? 'מרענן...' : 'רענן נתונים'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Wrapped with providers for full functionality
const HomePageWithProviders: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <HomePageExample />
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default HomePageWithProviders;
