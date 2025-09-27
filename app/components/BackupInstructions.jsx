'use client';

const BackupInstructions = () => {
  return (
    <div className="mt-8 p-4 bg-blue-50 rounded-lg">
      <h3 className="font-semibold text-blue-900 mb-2">הוראות שימוש:</h3>
      <ul className="text-sm text-blue-800 space-y-1">
        <li>• גיבויים נוצרים אוטומטית כל 5 דקות לאחר שינויים במערכת</li>
        <li>• ניתן ליצור גיבוי ידני בכל עת באמצעות הכפתור "צור גיבוי חדש"</li>
        <li>• הגיבויים נשמרים ב-KV וזמינים גם בפרודקשן</li>
        <li>• המערכת שומרת עד 50 גיבויים אחרונים</li>
        <li>• בדוק תקינות הנתונים לאחר כל שחזור</li>
      </ul>
    </div>
  );
};

export default BackupInstructions;
