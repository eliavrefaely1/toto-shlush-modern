'use client';

import { Shield, Settings, Users, Trophy, Database, UserCheck, FileText } from 'lucide-react';

const AdminTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'matches', label: 'משחקים', icon: Trophy, description: 'ניהול משחקים ותוצאות' },
    { id: 'participants', label: 'משתתפים', icon: UserCheck, description: 'ניהול משתתפים וניחושים' },
    { id: 'users', label: 'משתמשים', icon: Users, description: 'ניהול משתמשים' },
    { id: 'backups', label: 'גיבויים', icon: Database, description: 'ניהול גיבויים ונתונים' },
    { id: 'logs', label: 'לוגים', icon: FileText, description: 'מעקב אירועים ופעולות' },
    { id: 'settings', label: 'הגדרות', icon: Settings, description: 'הגדרות מערכת' },
  ];

  return (
    <div className="card mb-6 shadow-lg">
      <div className="card-content p-0">
        <div className="flex flex-wrap border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-1/2 sm:flex-1 px-4 py-4 text-center font-medium transition-all duration-200 flex flex-col items-center justify-center hover:bg-gray-50 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-b-2 border-blue-700 shadow-md'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              <tab.icon className={`w-6 h-6 mb-2 ${activeTab === tab.id ? 'text-white' : 'text-gray-600'}`} />
              <span className="text-sm truncate font-semibold mb-1">{tab.label}</span>
              <span className={`text-xs truncate ${activeTab === tab.id ? 'text-blue-100' : 'text-gray-500'}`}>
                {tab.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminTabs;
