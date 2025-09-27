'use client';

const RenameUserModal = ({ 
  showRenameModal, 
  setShowRenameModal, 
  renameUser, 
  setRenameUser, 
  newUserName, 
  setNewUserName, 
  handleRenameUser 
}) => {
  if (!showRenameModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4">שינוי שם משתמש</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם נוכחי</label>
            <input
              type="text"
              value={renameUser?.name || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם חדש</label>
            <input
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="הזן שם חדש"
              autoFocus
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              setShowRenameModal(false);
              setRenameUser(null);
              setNewUserName('');
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            ביטול
          </button>
          <button
            onClick={handleRenameUser}
            disabled={!newUserName.trim() || newUserName.trim() === renameUser?.name}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            שנה שם
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenameUserModal;
