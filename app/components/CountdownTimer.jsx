'use client';

const CountdownTimer = ({ countdown }) => {
  if (!countdown.active) return null;

  return (
    <div className="card mb-4">
      <div className="card-content text-center bg-blue-50 rounded">
        <h3 className="text-2xl font-bold text-blue-900 mb-2">סגירת הגשת הטפסים בעוד</h3>
        <div className="flex justify-center gap-6 text-4xl font-extrabold text-700">
          <div>
            <div>{String(countdown.s).padStart(2,'0')}</div>
            <div className="text-sm font-normal">שניות</div>
          </div>
          <div>
            <div>{String(countdown.m).padStart(2,'0')}</div>
            <div className="text-sm font-normal">דקות</div>
          </div>
          <div>
            <div>{String(countdown.h).padStart(2,'0')}</div>
            <div className="text-sm font-normal">שעות</div>
          </div>
          <div>
            <div>{String(countdown.d).padStart(2,'0')}</div>
            <div className="text-sm font-normal">ימים</div>
          </div>
        </div>
        <div className="text-sm text-gray-600 mt-2"> {}</div>
      </div>
    </div>
  );
};

export default CountdownTimer;
