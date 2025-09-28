#!/usr/bin/env node

/**
 * סקריפט להגדרת Vercel KV בלוקאלית
 * ⚠️ חשוב: זה מחליף את ה-localStorage ב-local-kv.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 הגדרת Vercel KV ללוקאלית...\n');

// בדיקה אם קיים קובץ .env.local
const envPath = path.join(__dirname, '.env.local');
const examplePath = path.join(__dirname, 'env-example.txt');

if (fs.existsSync(envPath)) {
  console.log('⚠️  קובץ .env.local כבר קיים!');
  console.log('📋 התוכן הנוכחי:');
  console.log(fs.readFileSync(envPath, 'utf8'));
  console.log('\n❓ האם אתה רוצה להחליף אותו? (y/N)');
  process.exit(0);
}

if (!fs.existsSync(examplePath)) {
  console.error('❌ קובץ env-example.txt לא נמצא!');
  process.exit(1);
}

// יצירת קובץ .env.local מהדוגמה
const exampleContent = fs.readFileSync(examplePath, 'utf8');
fs.writeFileSync(envPath, exampleContent);

console.log('✅ נוצר קובץ .env.local');
console.log('\n📝 השלבים הבאים:');
console.log('1. פתח את Vercel Dashboard');
console.log('2. לך לפרויקט שלך → Settings → Environment Variables');
console.log('3. העתק את הערכים של KV_URL, KV_REST_API_URL, KV_REST_API_TOKEN');
console.log('4. עדכן את הקובץ .env.local עם הערכים האמיתיים');
console.log('5. הפעל מחדש את השרת: npm run dev');
console.log('\n⚠️  חשוב: ודא שיש לך גיבוי מלא של הנתונים!');
