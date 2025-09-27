'use client';

import { useLeaderboardData } from '../hooks/useLeaderboardData';
import LeaderboardHeader from '../components/LeaderboardHeader';
import PotDisplay from '../components/PotDisplay';
import EmptyLeaderboard from '../components/EmptyLeaderboard';
import LeaderboardTable from '../components/LeaderboardTable';
import LeaderboardActions from '../components/LeaderboardActions';

export default function LeaderboardPage() {
  const {
    leaderboard,
    pot,
    matchesForWeek,
    expanded,
    isRefreshing,
    topScore,
    refreshNow,
    toggleExpanded,
    exportGuessesPNG
  } = useLeaderboardData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100" dir="rtl">
      <div className="relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <LeaderboardHeader 
            isRefreshing={isRefreshing} 
            refreshNow={refreshNow} 
            exportGuessesPNG={exportGuessesPNG} 
          />

          <PotDisplay pot={pot} />

          {leaderboard.length === 0 ? (
            <EmptyLeaderboard />
          ) : (
            <LeaderboardTable
              leaderboard={leaderboard}
              topScore={topScore}
              expanded={expanded}
              toggleExpanded={toggleExpanded}
              matchesForWeek={matchesForWeek}
            />
          )}

          <LeaderboardActions />
        </div>
      </div>
    </div>
  );
}
