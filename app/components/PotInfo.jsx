'use client';

import { Gift, Trophy } from 'lucide-react';

const PotInfo = ({ pot, settings }) => {
  return (
    <div className="max-w-6xl mx-auto px-0 mt-3">
      <div className="bg-white rounded-none border-0 shadow-none py-3 px-4 text-sm flex items-center justify-between" dir="rtl">                                                                                   
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">                                                                                       
            <Gift className="w-4 h-4 text-white" />
          </div>
          <span className="text-blue-800 font-bold">הקופה השבועית</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-blue-900">₪{pot.totalAmount.toLocaleString()}</span>
          <span className="text-xs text-gray-600">{pot.numOfPlayers} משתתפים × ₪{pot.amountPerPlayer}</span>                                                                                                       
        </div>
      </div>
      {/* פרס ראשון בטוטו */}
      <div className="bg-red-50 rounded-none border-0 shadow-none py-3 px-4 text-sm flex items-center justify-between" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <span className="text-red-800 font-bold">פרס ראשון בטוטו</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-red-900">₪{(settings.totoFirstPrize || 8000000).toLocaleString()}</span>
          <span className="text-xs text-gray-600">{pot.numOfPlayers} משתתפים</span>
          <span className="text-xs text-gray-600">₪{pot.numOfPlayers > 0 ? ((settings.totoFirstPrize || 8000000) / pot.numOfPlayers).toLocaleString('he-IL', { maximumFractionDigits: 2 }) : '0'} למשתתף</span>
        </div>
      </div>
    </div>
  );
};

export default PotInfo;
