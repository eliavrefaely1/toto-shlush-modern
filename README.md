# טוטו שלוש - אפליקציית טוטו החברים 🏆

אפליקציית Web מתקדמת לניהול טופסי טוטו 16 קבוצתיים עם תכונות מתקדמות של ניהול נתונים, גיבויים אוטומטיים ועדכונים בזמן אמת.

## 🌟 תכונות עיקריות

- 🎯 **ניהול טוטו 16** - יצירה ועדכון משחקים שבועיים
- 👥 **ניהול משתמשים** - הוספה ועדכון משתתפים
- 🎲 **הזנת ניחושים** - ממשק ידידותי להזנת ניחושים (1/X/2)
- 📊 **דירוג דינמי** - חישוב ניקוד אוטומטי וטבלת דירוג
- 💰 **ניהול קופה** - מעקב אחר סכומי כסף ופרסים
- 🔄 **עדכונים בזמן אמת** - WebSocket לעדכונים מיידיים
- 💾 **גיבויים אוטומטיים** - שמירה ושחזור נתונים
- 📧 **שליחת מיילים** - גיבויים אוטומטיים למייל
- 📱 **ממשק רספונסיבי** - עובד מושלם על כל המכשירים

## 🚀 טכנולוגיות

### Frontend
- **Next.js 14.2.32** - React Framework עם App Router
- **React 18.3.1** - UI Library
- **TypeScript 5.9.2** - Type Safety
- **Tailwind CSS 3.4.17** - Styling Framework
- **Lucide React** - Icon Library

### Backend & Database
- **Next.js API Routes** - Server-side API
- **Vercel KV** - Key-Value Database (Redis-like)
- **WebSocket** - Real-time communication
- **Rate Limiting** - Security & Performance

### Monitoring & Analytics
- **Sentry** - Error tracking & Performance monitoring
- **Vercel Analytics** - User behavior analytics
- **Uptime Robot** - System availability monitoring
- **Custom Health Check** - System health monitoring

## 🧪 הרצה מקומית

### התקנה מהירה
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

### הגדרת Vercel KV (אופציונלי)
```bash
# יצירת גיבוי
npm run backup

# הגדרת KV
npm run setup-kv
```

## 📁 מבנה פרויקט

```
toto-shlush-modern/
├── app/                          # Next.js App Router
│   ├── api/                      # API Endpoints
│   │   ├── add-guess/           # הוספת ניחוש
│   │   ├── add-match/           # הוספת משחק
│   │   ├── backup/             # מערכת גיבויים
│   │   ├── data/               # נתונים ראשיים
│   │   ├── health/             # בדיקת בריאות המערכת
│   │   ├── leaderboard/        # דירוג
│   │   ├── pot/                # ניהול קופה
│   │   ├── send-email/         # שליחת מיילים
│   │   └── websocket/          # WebSocket server
│   ├── components/              # React Components
│   ├── hooks/                   # Custom Hooks
│   ├── admin/                   # פאנל ניהול
│   ├── backup-manager/         # מנהל גיבויים
│   ├── guess/                   # דף הזנת ניחושים
│   ├── leaderboard/            # דף דירוג
│   └── instructions/           # הוראות שימוש
├── src/                          # TypeScript Source
│   ├── lib/                      # Core Libraries
│   │   ├── api-client.ts        # API communication
│   │   ├── data-manager.ts      # Data management
│   │   ├── websocket-client.ts  # WebSocket client
│   │   └── utils.ts             # Utility functions
│   ├── types/                    # Type Definitions
│   └── hooks/                    # TypeScript Hooks
├── backups/                      # Backup Storage
└── public/                       # Static Assets
```

## 🔧 הגדרת סביבה

### משתני סביבה נדרשים
```env
# Vercel KV
KV_URL=redis://your-kv-url
KV_REST_API_URL=https://your-rest-url
KV_REST_API_TOKEN=your-token

# Email (אופציונלי)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ADMIN_EMAIL=your-email@example.com

# Admin
ADMIN_TOKEN=your-secret-token
```

## 📊 API Endpoints

### נתונים
- `GET /api/data` - קבלת כל הנתונים
- `GET /api/data?diag=1` - בדיקת חיבור ל-KV

### ניחושים
- `POST /api/add-guess` - הוספת ניחוש חדש
- `PUT /api/update-guess` - עדכון ניחוש
- `DELETE /api/delete-guess` - מחיקת ניחוש

### משחקים
- `POST /api/add-match` - הוספת משחק חדש
- `PUT /api/update-match` - עדכון משחק
- `DELETE /api/delete-match` - מחיקת משחק

### גיבויים
- `GET /api/backup?action=create` - יצירת גיבוי
- `GET /api/backup?action=list` - רשימת גיבויים
- `POST /api/backup` - שחזור מגיבוי

### בריאות המערכת
- `GET /api/health` - בדיקת בריאות המערכת

## 🎮 שימוש במערכת

### למשתמשים רגילים
1. **דף הבית** - צפייה בדירוג הנוכחי ומידע על הקופה
2. **הזנת ניחושים** - `/guess` - הזנת ניחושים למשחקים
3. **דירוג** - `/leaderboard` - צפייה בטבלת הדירוג המלאה

### למנהלים
1. **פאנל ניהול** - `/admin` - ניהול משחקים, משתמשים והגדרות
2. **מנהל גיבויים** - `/backup-manager` - ניהול גיבויים ושחזור
3. **הוראות** - `/instructions` - מדריך מפורט לשימוש

## 🔒 אבטחה

- **Rate Limiting** - הגבלת בקשות (100 GET/דקה, 50 PUT/דקה)
- **Input Validation** - בדיקת תקינות כל הקלטים
- **Admin Authentication** - טוקן אדמין לפעולות רגישות
- **Error Tracking** - מעקב אחר שגיאות עם Sentry

## 📈 מעקב ובקרה

### Dashboards
- **Sentry**: https://sentry.io - מעקב שגיאות וביצועים
- **Vercel Analytics**: https://vercel.com/dashboard - אנליטיקס משתמשים
- **Uptime Robot**: https://uptimerobot.com - מעקב זמינות

### Health Check
- **Endpoint**: `/api/health`
- **בדיקות**: חיבור KV, זיכרון, זמן תגובה

## 🚀 פריסה

הפרויקט מוכן לפריסה ב-Vercel:

```bash
# פריסה אוטומטית
git push origin main

# או פריסה ידנית
vercel --prod
```

## 📞 תמיכה

- **GitHub Issues**: https://github.com/eliavrefaely1/toto-shlush/issues
- **Email**: eliavrefaely1@gmail.com
- **Documentation**: ראה קבצי MD בפרויקט

## 📄 רישיון

ISC License - ראה קובץ LICENSE לפרטים מלאים.

---

**🏆 טוטו שלוש - המקום לזכות בגדול! 💰**

