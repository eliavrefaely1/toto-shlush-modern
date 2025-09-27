'use client';

import { CheckCircle } from 'lucide-react';

const SuccessMessage = ({ formData }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100">
      <div className="card max-w-md mx-auto text-center">
        <div className="card-content">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-green-800 mb-4">הניחושים נשמרו! 🎉</h2>
          <p className="text-lg text-gray-600 mb-6">
            תודה {formData.name}! הניחושים שלך נשמרו בהצלחה.
          </p>
          <p className="text-sm text-gray-500">
            מעביר אותך לטבלת הדירוג...
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuccessMessage;
