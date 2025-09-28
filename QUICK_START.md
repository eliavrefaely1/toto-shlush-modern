# 🚀 הוראות מהירות - הגדרת Vercel KV ללוקאלית

## ⚠️ נתונים קיימים במערכת:
- **34 משתמשים** 
- **33 ניחושים**
- **נתונים חשובים - אל תמחק!**

## 📋 שלבים מהירים:

### 1. גיבוי (✅ הושלם)
```bash
npm run backup
```
גיבוי נוצר ב: `backups/backup-2025-09-28T19-54-17-752Z/`

### 2. הגדרת משתני סביבה
```bash
npm run setup-kv
```

### 3. קבלת פרטי Vercel KV
1. לך ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. בחר בפרויקט `toto-shlush`
3. Settings → Environment Variables
4. העתק את הערכים:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

### 4. עדכון .env.local
```env
KV_REST_API_URL=https://your-actual-url
KV_REST_API_TOKEN=your-actual-token
```

### 5. הפעלה מחדש
```bash
npm run dev
```

## 🔍 בדיקה:
לך ל: `http://localhost:3001/api/data?diag=1`

## 🆘 אם משהו לא עובד:
מחק את `.env.local` וחזור ל-localStorage

---
**זכור: כל הנתונים נשמרים - אין סכנה לאיבוד נתונים!**
