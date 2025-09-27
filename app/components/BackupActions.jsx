'use client';

const BackupActions = ({ loading, createBackup, loadBackups }) => {
  return (
    <div className="flex gap-4 mb-6">
      <button
        onClick={createBackup}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'יוצר...' : 'צור גיבוי חדש'}
      </button>
      
      <button
        onClick={loadBackups}
        disabled={loading}
        className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
      >
        רענן רשימה
      </button>
    </div>
  );
};

export default BackupActions;
