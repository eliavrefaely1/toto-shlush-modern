'use client';

const EditGuessModal = ({ 
  showEditGuessModal, 
  editGuessUser, 
  editGuessData, 
  tempGuesses, 
  handleGuessChange, 
  closeEditGuessModal, 
  saveEditedGuess, 
  matches 
}) => {
  if (!showEditGuessModal || !editGuessUser || !editGuessData || !editGuessData.guesses) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          עריכת ניחוש - {editGuessUser.name}
        </h3>
        <div className="space-y-6">
          {/* סיכום נוכחי */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-bold text-gray-800 mb-2">ניחושים נוכחיים:</h4>
            <div className="grid grid-cols-8 gap-2">
              {editGuessData.guesses.map((guess, index) => (
                <div key={index} className="text-center p-2 bg-white rounded border">
                  <div className="text-xs text-gray-600">{index + 1}</div>
                  <div className="text-lg font-bold">{guess || '?'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* עריכת ניחושים */}
          <div>
            <h4 className="font-bold text-gray-800 mb-4">ערוך ניחושים:</h4>
            {matches.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">אין משחקים זמינים לעריכה</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {matches.map((match, index) => (
                  <div key={match.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="text-center mb-3">
                      <h5 className="font-bold text-blue-800 text-sm">משחק {index + 1}</h5>
                      <div className="text-sm font-bold text-green-700">
                        {match.homeTeam} vs {match.awayTeam}
                      </div>
                    </div>
                    <div className="flex justify-center gap-2">
                      {['1', 'X', '2'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleGuessChange(index, option)}
                          className={`w-10 h-10 rounded-full text-lg font-bold transition-all ${
                            tempGuesses[index] === option
                              ? 'bg-blue-500 text-white shadow-lg scale-110'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* סיכום חדש */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-bold text-gray-800 mb-2">ניחושים חדשים:</h4>
            <div className="grid grid-cols-8 gap-2">
              {tempGuesses.map((guess, index) => (
                <div key={index} className="text-center p-2 bg-white rounded border">
                  <div className="text-xs text-gray-600">{index + 1}</div>
                  <div className="text-lg font-bold">{guess || '?'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={closeEditGuessModal}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            ביטול
          </button>
          <button
            onClick={saveEditedGuess}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            שמור שינויים
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditGuessModal;
