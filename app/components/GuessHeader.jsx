'use client';

import { Target, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const GuessHeader = () => {
  const router = useRouter();

  return (
    <>
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <button onClick={() => router.push('/')} className="btn btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          חזרה לדף הבית
        </button>
      </div>
      
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Target className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-blue-800">מלא את הניחושים שלך</h1>
        </div>
        <p className="text-lg text-gray-600">בחר 1, X או 2 לכל משחק</p>
      </div>
    </>
  );
};

export default GuessHeader;
