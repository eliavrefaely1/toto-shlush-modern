'use client';

import { useHomeData } from './hooks/useHomeData';
import HomeHeader from './components/HomeHeader';
import PotInfo from './components/PotInfo';
import CountdownTimer from './components/CountdownTimer';
import LeaderboardPreview from './components/LeaderboardPreview';
import MatchesPreview from './components/MatchesPreview';
import ActionButtons from './components/ActionButtons';
import HomeFooter from './components/HomeFooter';

export default function Home() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100" dir="rtl">
      <div className="relative z-10">
        <PotInfo pot={pot} settings={settings} />
        
        <HomeHeader isRefreshing={isRefreshing} refreshData={refreshData} />

        <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          <CountdownTimer countdown={countdown} />
          
          <LeaderboardPreview leaderboard={leaderboard} topScore={topScore} />
          
          <MatchesPreview matchesByDay={matchesByDay} />

          <ActionButtons />
        </main>

        <HomeFooter />
      </div>
    </div>
  );
}
