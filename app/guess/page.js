'use client';

import { useGuessData } from '../hooks/useGuessData';
import GuessHeader from '../components/GuessHeader';
import PersonalDetailsForm from '../components/PersonalDetailsForm';
import GuessForm from '../components/GuessForm';
import SubmitButton from '../components/SubmitButton';
import SuccessMessage from '../components/SuccessMessage';

export default function GuessPage() {
  const {
    formData,
    matches,
    isSubmitting,
    currentMatchIndex,
    showSuccess,
    isLocked,
    handleInputChange,
    handleGuessChange,
    handleSubmit,
    nextMatch,
    prevMatch,
    setCurrentMatchIndex,
    fillRandomGuesses
  } = useGuessData();

  if (showSuccess) {
    return <SuccessMessage formData={formData} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100" dir="rtl">
      <div className="relative z-10">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <GuessHeader />

          <form onSubmit={handleSubmit}>
            <PersonalDetailsForm 
              formData={formData} 
              handleInputChange={handleInputChange} 
            />

            <GuessForm
              matches={matches}
              currentMatchIndex={currentMatchIndex}
              formData={formData}
              handleGuessChange={handleGuessChange}
              setCurrentMatchIndex={setCurrentMatchIndex}
              nextMatch={nextMatch}
              prevMatch={prevMatch}
              fillRandomGuesses={fillRandomGuesses}
            />

            <SubmitButton isSubmitting={isSubmitting} isLocked={isLocked} />
          </form>
          
          {isLocked && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-center">
              ההגשה סגורה כעת על ידי המנהל. ניתן לעיין במשחקים ולערוך טיוטה, אך לא לשלוח.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
