'use client';

import { ArrowLeft, Target } from 'lucide-react';
import Link from 'next/link';

const LeaderboardActions = () => {
  return (
    <div className="flex justify-center gap-4 mt-8">
      <Link href="/" className="btn btn-secondary flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" />
        חזרה לדף הבית
      </Link>
      <Link href="/guess" className="btn btn-primary flex items-center gap-2">
        <Target className="w-4 h-4" />
        מלא טופס חדש
      </Link>
    </div>
  );
};

export default LeaderboardActions;
