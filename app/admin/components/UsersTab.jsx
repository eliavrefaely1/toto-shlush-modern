'use client';

import { Users, Edit, Trash2 } from 'lucide-react';

const UsersTab = ({ 
  participants, 
  sortAll, 
  setSortAll, 
  byUserId, 
  getScore, 
  openRenameModal, 
  deleteUserCompletely 
}) => {
  return (
    <div className="space-y-6">
      <div className="card shadow-lg">
        <div className="card-header bg-gradient-to-r from-indigo-50 to-indigo-100">
          <h2 className="text-xl font-bold text-indigo-800">ניהול משתמשים</h2>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-gray-600">סה"כ {participants.length} משתמשים</p>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">מיין לפי:</label>
              <select 
                value={sortAll} 
                onChange={(e) => setSortAll(e.target.value)} 
                className="input w-64 text-sm"
              >
                <option value="name_asc">שם (א׳→ת׳)</option>
                <option value="name_desc">שם (ת׳→א׳)</option>
                <option value="joined_new">תאריך הצטרפות (חדש→ישן)</option>
                <option value="joined_old">תאריך הצטרפות (ישן→חדש)</option>
                <option value="hasguess_first">יש ניחוש לשבוע (תחילה)</option>
              </select>
            </div>
          </div>
        </div>
        <div className="card-content">
          {participants.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">אין משתמשים רשומים</p>
            </div>
          ) : (
            <div className="space-y-3">
              {participants.map((u) => {
                const g = byUserId.get(u.id);
                const score = getScore(u);
                return (
                  <div key={`user-${u.id}`} className="flex items-center justify-between border rounded-lg p-4 bg-gradient-to-br from-white to-gray-50 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex-1">
                      <div className="font-bold text-indigo-800 text-lg">{u.name}</div>
                      <div className="text-xs text-gray-500">
                        הצטרף: {new Date(u.createdAt).toLocaleDateString('he-IL')}
                      </div>
                      {g ? (
                        <div className="text-xs text-green-700 mt-1">יש ניחוש</div>
                      ) : (
                        <div className="text-xs text-gray-500 mt-1">אין ניחוש</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">ניקוד שבועי</div>
                      <div className="text-lg font-bold text-blue-600 text-right">{score || 0}</div>
                      <div className="flex gap-2 mt-2">
                        <button 
                          onClick={() => openRenameModal(u)} 
                          className="btn btn-secondary flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" /> שנה שם
                        </button>
                        <button 
                          onClick={() => deleteUserCompletely(u.id)} 
                          className="btn btn-danger flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> מחק משתמש
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersTab;
