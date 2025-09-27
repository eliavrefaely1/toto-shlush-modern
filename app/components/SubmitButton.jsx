'use client';

import { Save } from 'lucide-react';

const SubmitButton = ({ isSubmitting, isLocked }) => {
  return (
    <div className="text-center">
      <button
        type="submit"
        disabled={isSubmitting || isLocked}
        className="btn btn-primary text-xl py-4 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            שומר...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Save className="w-5 h-5" />
            {isLocked ? 'ההגשה סגורה' : 'שלח ניחושים'}
          </div>
        )}
      </button>
    </div>
  );
};

export default SubmitButton;
