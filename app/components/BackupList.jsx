'use client';

const BackupList = ({ 
  backups, 
  loading, 
  formatDate, 
  formatFileSize, 
  restoreBackup, 
  deleteBackup 
}) => {
  if (loading && backups.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">טוען גיבויים...</p>
      </div>
    );
  }

  if (backups.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        אין גיבויים זמינים
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {backups.map((backup, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                גיבוי {index + 1}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                נוצר: {formatDate(backup.created)}
              </p>
              <p className="text-sm text-gray-600">
                גודל: {formatFileSize(backup.size)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ID: {backup.id}
              </p>
              {backup.files && (
                <div className="text-xs text-gray-500 mt-1">
                  נתונים: {backup.files.mainData ? '✓' : '✗'} ראשי, {backup.files.usersData ? '✓' : '✗'} משתמשים, {backup.files.weeks} שבועות
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => restoreBackup(backup.id)}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                שחזר
              </button>
              
              <button
                onClick={() => deleteBackup(backup.id)}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50"
              >
                מחק
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BackupList;
