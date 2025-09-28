# 🔧 הגדרת Vercel KV ללוקאלית

מדריך זה מסביר איך להגדיר את מערכת טוטו שלוש לעבוד עם Vercel KV גם בלוקאלית, כדי לפשט את הפיתוח ולסנכרן נתונים עם הפרודוקציה.

## ⚠️ אזהרה חשובה

**אל תמחק שום דבר מה-DB הקיים!** כל הנתונים הקיימים נשמרים ויישארו זמינים. המערכת תתמוך גם ב-localStorage וגם ב-Vercel KV.

## 🚀 שלבי ההגדרה

### 1. יצירת גיבוי מלא

```bash
npm run backup
```

זה יוצר גיבוי מלא של הנתונים הקיימים (מקומי + פרודוקציה) עם כל המידע הרלוונטי.

### 2. הגדרת משתני סביבה

```bash
npm run setup-kv
```

זה יוצר קובץ `.env.local` עם התבנית הנדרשת.

### 3. קבלת פרטי Vercel KV

1. לך ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. בחר בפרויקט `toto-shlush`
3. לך ל-**Settings** → **Environment Variables**
4. מצא את המשתנים הבאים:
   - `KV_URL`
   - `KV_REST_API_URL` 
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### 4. עדכון הקובץ .env.local

פתח את הקובץ `.env.local` והחלף את הערכים:

```env
KV_URL=redis://your-actual-kv-url
KV_REST_API_URL=https://your-actual-rest-url
KV_REST_API_TOKEN=your-actual-token
KV_REST_API_READ_ONLY_TOKEN=your-actual-read-only-token
```

### 5. הפעלה מחדש

```bash
npm run dev
```

## 🔍 בדיקה שהכל עובד

1. פתח את הדפדפן ב-`http://localhost:3001`
2. לך ל-`http://localhost:3001/api/data?diag=1`
3. בדוק שהמשתנים מוצגים כ-`true`

## 📊 מה קורה עכשיו?

- **לפני**: נתונים נשמרו ב-localStorage (רק מקומי)
- **אחרי**: נתונים נשמרים ב-Vercel KV (זמין מכל מקום)
- **תמיכה כפולה**: המערכת תומכת גם ב-localStorage וגם ב-KV

## 🛡️ בטיחות

- כל הנתונים הקיימים נשמרים
- הגיבוי נוצר אוטומטית
- המערכת עובדת עם אותם נתונים בפרודוקציה ולוקאלית
- תמיכה ב-localStorage כגיבוי חלופי

## 🆘 אם משהו לא עובד

1. בדוק שהמשתנים נכונים ב-`.env.local`
2. ודא שהשרת הופעל מחדש
3. בדוק את הלוגים בקונסול
4. אם צריך, חזור ל-localStorage על ידי מחיקת `.env.local`

## 📁 קבצים שנוצרו

- `env-example.txt` - תבנית משתני סביבה
- `setup-local-kv.js` - סקריפט הגדרה
- `backup-data.js` - סקריפט גיבוי
- `backups/` - תיקיית גיבויים
- `.env.local` - משתני סביבה מקומיים

## ✅ יתרונות

- פיתוח מהיר יותר
- נתונים מסונכרנים
- אין צורך להגדיר DB מקומי
- עבודה עם אותם נתונים בפרודוקציה ולוקאלית
- תמיכה ב-localStorage כגיבוי
- מעבר חלק בין מצבי עבודה
