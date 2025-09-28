# 🚀 הוראות מהירות - טוטו שלוש

מדריך מהיר להפעלת אפליקציית טוטו שלוש עם כל התכונות המתקדמות.

## ⚡ התקנה מהירה (5 דקות)

### 1. שכפול והתקנה
```bash
# שכפול הפרויקט
git clone https://github.com/eliavrefaely1/toto-shlush.git
cd toto-shlush-modern

# התקנת dependencies
npm install

# הרצה מקומית
npm run dev
```

האפליקציה תהיה זמינה ב: `http://localhost:3001`

### 2. בדיקה ראשונית
- פתח את הדפדפן ב-`http://localhost:3001`
- בדוק שהדף נטען בהצלחה
- לך ל-`/admin` ובדוק את פאנל הניהול

## 🔧 הגדרת Vercel KV (מומלץ)

### שלב 1: יצירת גיבוי
```bash
npm run backup
```
זה יוצר גיבוי מלא של הנתונים הקיימים.

### שלב 2: הגדרת משתני סביבה
```bash
npm run setup-kv
```
זה יוצר קובץ `.env.local` עם התבנית הנדרשת.

### שלב 3: קבלת פרטי Vercel KV
1. לך ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. בחר בפרויקט `toto-shlush`
3. לך ל-**Settings** → **Environment Variables**
4. מצא את המשתנים הבאים:
   - `KV_URL`
   - `KV_REST_API_URL` 
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### שלב 4: עדכון הקובץ .env.local
פתח את הקובץ `.env.local` והחלף את הערכים:
```env
KV_URL=redis://your-actual-kv-url
KV_REST_API_URL=https://your-actual-rest-url
KV_REST_API_TOKEN=your-actual-token
KV_REST_API_READ_ONLY_TOKEN=your-actual-read-only-token
```

### שלב 5: הפעלה מחדש
```bash
npm run dev
```

## 🔍 בדיקה שהכל עובד

### בדיקת חיבור ל-KV
לך ל: `http://localhost:3001/api/data?diag=1`

אמור לראות:
```json
{
  "kvConnected": true,
  "kvUrl": "redis://...",
  "restApiUrl": "https://...",
  "hasToken": true
}
```

### בדיקת בריאות המערכת
לך ל: `http://localhost:3001/api/health`

## 🎮 שימוש ראשוני

### למשתמשים רגילים
1. **דף הבית** - צפייה בדירוג ומידע על הקופה
2. **הזנת ניחושים** - `/guess` - הזנת ניחושים למשחקים
3. **דירוג** - `/leaderboard` - צפייה בטבלת הדירוג

### למנהלים
1. **פאנל ניהול** - `/admin` - ניהול משחקים ומשתמשים
2. **מנהל גיבויים** - `/backup-manager` - ניהול גיבויים
3. **הוראות** - `/instructions` - מדריך מפורט

## 📧 הגדרת מיילים (אופציונלי)

### שלב 1: יצירת חשבון Resend
1. היכנס ל-[Resend.com](https://resend.com)
2. צור חשבון חדש (חינמי עד 3,000 מיילים בחודש)

### שלב 2: קבלת API Key
1. היכנס ל-Dashboard של Resend
2. לך ל-API Keys
3. צור API Key חדש

### שלב 3: הוספה ל-.env.local
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ADMIN_EMAIL=your-email@example.com
```

## 🔄 תכונות מתקדמות

### עדכונים בזמן אמת
- המערכת כוללת WebSocket לעדכונים מיידיים
- הדירוג מתעדכן אוטומטית כשמישהו שולח ניחוש
- הקופה מתעדכנת בזמן אמת

### גיבויים אוטומטיים
- גיבוי אוטומטי כל 5 דקות
- גיבוי ידני דרך פאנל הניהול
- שחזור מגיבויים קיימים

### מעקב ובקרה
- **Sentry** - מעקב שגיאות
- **Vercel Analytics** - אנליטיקס משתמשים
- **Health Check** - בדיקת בריאות המערכת

## 🆘 פתרון בעיות

### אם האפליקציה לא נטענת
```bash
# בדוק שהפורט פנוי
lsof -i :3001

# או שנה פורט
npm run dev -- -p 3002
```

### אם יש בעיה עם KV
```bash
# מחק את .env.local וחזור ל-localStorage
rm .env.local
npm run dev
```

### אם יש שגיאות
1. בדוק את הלוגים בקונסול הדפדפן
2. בדוק את הלוגים בטרמינל
3. לך ל-`/api/health` לבדיקת בריאות המערכת

## 📊 סקריפטים זמינים

```bash
# הרצה מקומית
npm run dev

# בנייה לפרודוקציה
npm run build

# הרצה בפרודוקציה
npm run start

# יצירת גיבוי
npm run backup

# הגדרת KV
npm run setup-kv

# ניקוי cache
npm run clean
```

## ✅ מה הלאה?

1. **הוסף משתמשים** דרך פאנל הניהול
2. **צור משחקים** לשבוע הנוכחי
3. **הזן ניחושים** לדף ההזנה
4. **עקוב אחר הדירוג** בדף הדירוג
5. **נהל את הקופה** בפאנל הניהול

---

**🏆 טוטו שלוש מוכן לשימוש! בהצלחה! 💰**
