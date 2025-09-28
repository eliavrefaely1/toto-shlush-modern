#!/usr/bin/env node

/**
 * סקריפט ליצירת גיבוי מלא של הנתונים
 * ⚠️ חשוב: הפעל לפני כל שינוי ב-DB!
 */

const fs = require('fs');
const path = require('path');

async function backupData() {
  console.log('💾 יצירת גיבוי נתונים...\n');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, 'backups', `backup-${timestamp}`);
  
  // צור תיקיית גיבוי
  if (!fs.existsSync(path.join(__dirname, 'backups'))) {
    fs.mkdirSync(path.join(__dirname, 'backups'));
  }
  fs.mkdirSync(backupDir);
  
  try {
    // נסה לקבל נתונים מהשרת המקומי
    const localData = await fetch('http://localhost:3001/api/data').catch(() => null);
    
    if (localData && localData.ok) {
      const data = await localData.json();
      fs.writeFileSync(
        path.join(backupDir, 'local-backup.json'),
        JSON.stringify(data, null, 2)
      );
      console.log('✅ גיבוי נתונים מקומיים נוצר');
    } else {
      console.log('⚠️  לא ניתן לקבל נתונים מהשרת המקומי');
    }
    
    // נסה לקבל נתונים מהפרודוקציה
    const prodData = await fetch('https://toto-shlush.vercel.app/api/data').catch(() => null);
    
    if (prodData && prodData.ok) {
      const data = await prodData.json();
      fs.writeFileSync(
        path.join(backupDir, 'production-backup.json'),
        JSON.stringify(data, null, 2)
      );
      console.log('✅ גיבוי נתונים מפרודוקציה נוצר');
    } else {
      console.log('⚠️  לא ניתן לקבל נתונים מפרודוקציה');
    }
    
    // צור README עם פרטים
    const readme = `# גיבוי נתונים - ${timestamp}

## תוכן הגיבוי:
- local-backup.json: נתונים מהשרת המקומי
- production-backup.json: נתונים מפרודוקציה

## הוראות שחזור:
1. לך ל-Vercel Dashboard
2. בחר בפרויקט שלך
3. לך ל-KV Storage
4. השתמש ב-REST API לשחזור הנתונים

## ⚠️ חשוב:
- שמור את הגיבוי במקום בטוח
- אל תמחק נתונים ללא אישור מפורש
- בדוק את הנתונים לפני שחזור
`;
    
    fs.writeFileSync(path.join(backupDir, 'README.md'), readme);
    
    console.log(`\n🎉 גיבוי הושלם בהצלחה!`);
    console.log(`📁 מיקום: ${backupDir}`);
    
  } catch (error) {
    console.error('❌ שגיאה ביצירת הגיבוי:', error.message);
  }
}

backupData();
