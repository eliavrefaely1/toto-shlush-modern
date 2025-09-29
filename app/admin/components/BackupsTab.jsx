'use client';

import { Database, Download, Upload, Mail, RefreshCw, Shield, Trash2, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const BackupsTab = ({ 
  sendBackupToEmail, 
  testEmailService, 
  isLoading,
  settings,
  tempAdminEmail,
  setTempAdminEmail,
  updateSettings,
  restoreBackup,
  showToast
}) => {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* גיבויים אוטומטיים */}
      <div className="card shadow-lg">
        <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100">
          <h2 className="text-xl font-bold text-blue-800">גיבויים אוטומטיים</h2>
          <p className="text-gray-600">ניהול גיבויים אוטומטיים ושליחה למייל</p>
        </div>
        <div className="card-content">
          <div className="space-y-6">
            {/* הגדרת מייל לגיבויים */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                כתובת מייל לגיבויים
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={tempAdminEmail}
                  onChange={(e) => setTempAdminEmail(e.target.value)}
                  className="input flex-1"
                  placeholder="admin@example.com"
                />
                <button
                  onClick={() => updateSettings({ adminEmail: tempAdminEmail })}
                  className="btn btn-primary px-4 py-2"
                  disabled={tempAdminEmail === (settings.adminEmail || '')}
                >
                  שמור
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                גיבויים יישלחו אוטומטית לכתובת זו
              </p>
            </div>

            {/* הוראות הגדרת מייל */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                הגדרת שירות מייל
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• צור חשבון ב-<a href="https://resend.com" target="_blank" className="underline font-medium">Resend.com</a></li>
                <li>• קבל API Key</li>
                <li>• הוסף RESEND_API_KEY למשתני הסביבה</li>
                <li>• לחץ "בדוק שירות מייל" לוודא שהכל עובד</li>
              </ul>
            </div>

            {/* סטטוס מייל */}
            <div className="p-3 rounded border flex items-center gap-2 text-sm ${settings.adminEmail || tempAdminEmail ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}">
              {settings.adminEmail || tempAdminEmail ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  כתובת מייל מוגדרת: {(settings.adminEmail || tempAdminEmail)}
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  לא הוגדרה כתובת מייל לגיבויים
                </>
              )}
            </div>

            {/* כפתורי פעולה */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={sendBackupToEmail} 
                disabled={isLoading} 
                className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 disabled:opacity-50 shadow-md hover:shadow-lg transition-shadow"
              >
                <Mail className="w-4 h-4" /> שלח גיבוי למייל
              </button>
              
              <button 
                onClick={testEmailService} 
                disabled={isLoading} 
                className="btn bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 disabled:opacity-50 shadow-md hover:shadow-lg transition-shadow"
              >
                <RefreshCw className="w-4 h-4" /> בדוק שירות מייל
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ניהול גיבויים */}
      <div className="card shadow-lg">
        <div className="card-header bg-gradient-to-r from-green-50 to-green-100">
          <h2 className="text-xl font-bold text-green-800">ניהול גיבויים</h2>
          <p className="text-gray-600">גישה למנהל הגיבויים המלא</p>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            <p className="text-gray-600">
              עבור לניהול גיבויים מתקדם עם אפשרויות ייבוא, ייצוא וניהול היסטוריית גיבויים.
            </p>
            <button 
              onClick={() => router.push('/backup-manager')} 
              className="btn bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
            >
              <Database className="w-4 h-4" /> פתח מנהל גיבויים
            </button>
          </div>
        </div>
      </div>

      {/* שחזור מגיבוי JSON */}
      <div className="card shadow-lg">
        <div className="card-header bg-gradient-to-r from-orange-50 to-orange-100">
          <h2 className="text-xl font-bold text-orange-800">שחזור מגיבוי JSON</h2>
          <p className="text-gray-600">העלה קובץ גיבוי לשחזור מלא של המערכת</p>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            <input 
              type="file" 
              accept="application/json"
              onChange={async (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                try {
                  const text = await file.text();
                  const json = JSON.parse(text);
                  await restoreBackup(json);
                } catch (err) {
                  console.error('Restore JSON error:', err);
                  showToast('שגיאה בקריאת קובץ הגיבוי', 'error');
                }
              }}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* מידע על הגיבויים */}
      <div className="card shadow-lg">
        <div className="card-header bg-gradient-to-r from-gray-50 to-gray-100">
          <h2 className="text-xl font-bold text-gray-800">מידע על הגיבויים</h2>
          <p className="text-gray-600">פרטים על מערכת הגיבויים</p>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  מה נשמר בגיבוי?
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• כל המשחקים והתוצאות</li>
                  <li>• כל המשתמשים והמשתתפים</li>
                  <li>• כל הניחושים והניקוד</li>
                  <li>• הגדרות המערכת</li>
                </ul>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  אבטחה
                </h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• גיבויים מוצפנים</li>
                  <li>• גישה מוגבלת למנהלים</li>
                  <li>• גיבויים אוטומטיים יומיים</li>
                  <li>• שמירה מקומית ובענן</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupsTab;
