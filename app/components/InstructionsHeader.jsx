'use client';

import { Info } from 'lucide-react';

const InstructionsHeader = () => {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-3 mb-3">
        <Info className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-blue-800">איך משחקים בטוטו שלוש</h1>
      </div>
      <p className="text-gray-600">עמוד הוראות מחודש – קצר, ברור ומעשי</p>
    </div>
  );
};

export default InstructionsHeader;
