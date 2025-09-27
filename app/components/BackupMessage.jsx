'use client';

const BackupMessage = ({ message }) => {
  if (!message) return null;

  return (
    <div className={`mb-4 p-4 rounded-lg ${
      message.includes('שגיאה') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
    }`}>
      {message}
    </div>
  );
};

export default BackupMessage;
