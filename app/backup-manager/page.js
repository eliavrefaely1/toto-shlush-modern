'use client';

import { useBackupData } from '../hooks/useBackupData';
import BackupManagerHeader from '../components/BackupManagerHeader';
import BackupMessage from '../components/BackupMessage';
import BackupActions from '../components/BackupActions';
import BackupList from '../components/BackupList';
import BackupInstructions from '../components/BackupInstructions';
import BackupNavigation from '../components/BackupNavigation';

export default function BackupManager() {
  const {
    backups,
    loading,
    message,
    loadBackups,
    createBackup,
    deleteBackup,
    restoreBackup,
    formatFileSize,
    formatDate
  } = useBackupData();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <BackupManagerHeader />

          <BackupMessage message={message} />

          <BackupActions 
            loading={loading} 
            createBackup={createBackup} 
            loadBackups={loadBackups} 
          />

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              גיבויים קיימים ({backups.length})
            </h2>

            <BackupList
              backups={backups}
              loading={loading}
              formatDate={formatDate}
              formatFileSize={formatFileSize}
              restoreBackup={restoreBackup}
              deleteBackup={deleteBackup}
            />
          </div>

          <BackupInstructions />

          <BackupNavigation />
        </div>
      </div>
    </div>
  );
}
