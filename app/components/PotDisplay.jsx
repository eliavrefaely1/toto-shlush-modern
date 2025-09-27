'use client';

const PotDisplay = ({ pot }) => {
  return (
    <div className="card mb-8">
      <div className="card-content">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center text-blue-900">
          <div className="text-5xl font-bold mb-2">₪{pot.totalAmount.toLocaleString()}</div>
          <p className="text-lg">{pot.numOfPlayers} משתתפים × ₪{pot.amountPerPlayer}</p>
        </div>
      </div>
    </div>
  );
};

export default PotDisplay;
