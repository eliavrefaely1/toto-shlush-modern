# מערכת עדכונים בזמן אמת - WebSocket

## סקירה כללית

הוספתי מערכת WebSocket מתקדמת למערכת טוטו שלוש המאפשרת עדכונים בזמן אמת לכל המשתמשים. המערכת כוללת:

- **WebSocket Server** - שרת WebSocket עם ניהול חיבורים
- **WebSocket Client** - לקוח WebSocket עם auto-reconnect
- **React Hooks** - hooks מותאמים אישית לעדכונים בזמן אמת
- **UI Components** - רכיבי ממשק לעדכונים בזמן אמת
- **Real-time Notifications** - הודעות מערכת בזמן אמת

## רכיבים שנוספו

### 1. WebSocket Server (`/app/api/websocket/route.js`)
- ניהול חיבורי WebSocket
- Broadcast messages לכל המשתמשים
- Ping/Pong לבדיקת חיבורים חיים
- ניהול subscriptions לאירועים ספציפיים

### 2. WebSocket Client (`/src/lib/websocket-client.ts`)
- Singleton pattern לניהול חיבור יחיד
- Auto-reconnect עם exponential backoff
- Event handling מתקדם
- Connection state management

### 3. React Hooks (`/src/hooks/useWebSocket.ts`)

#### `useWebSocket(options)`
Hook בסיסי לניהול WebSocket connection:
```typescript
const { isConnected, sendMessage, on, off } = useWebSocket({
  userId: 'user123',
  autoConnect: true,
  events: ['leaderboard_updated', 'pot_updated']
});
```

#### `useLeaderboardUpdates()`
Hook מיוחד לעדכוני דירוג:
```typescript
const { leaderboard, lastUpdate, isConnected } = useLeaderboardUpdates();
```

#### `usePotUpdates()`
Hook מיוחד לעדכוני קופה:
```typescript
const { pot, lastUpdate, isConnected } = usePotUpdates();
```

#### `useMatchUpdates()`
Hook מיוחד לעדכוני משחקים:
```typescript
const { matches, lastUpdate, isConnected } = useMatchUpdates();
```

#### `useSystemNotifications()`
Hook להודעות מערכת:
```typescript
const { notifications, maintenanceMode, dismissNotification } = useSystemNotifications();
```

### 4. UI Components

#### `RealTimeIndicator`
מציג סטטוס חיבור WebSocket:
- אייקון חיבור (Wifi/WifiOff)
- סטטוס טקסט (מחובר/מנותק/מתחבר)
- כפתור חיבור/ניתוק

#### `NotificationToast`
הודעות מערכת בזמן אמת:
- הודעות הצלחה/שגיאה/אזהרה
- Auto-dismiss אחרי 5 שניות
- Animation מתקדם
- Dismiss manual

#### `RealTimeLeaderboard`
דירוג בזמן אמת:
- עדכונים אוטומטיים
- אינדיקטור "חי"
- זמן עדכון אחרון
- Fallback לנתונים סטטיים

## אירועי WebSocket

### User Events
- `user_joined` - משתמש חדש הצטרף
- `user_left` - משתמש עזב

### Guess Events
- `guess_submitted` - ניחוש חדש נשלח
- `guess_updated` - ניחוש עודכן
- `guess_deleted` - ניחוש נמחק

### Match Events
- `match_added` - משחק חדש נוסף
- `match_updated` - משחק עודכן (בעיקר תוצאות)
- `match_deleted` - משחק נמחק

### Leaderboard Events
- `leaderboard_updated` - דירוג עודכן
- `score_calculated` - ניקוד חושב מחדש

### Pot Events
- `pot_updated` - קופה עודכנה

### Admin Events
- `settings_updated` - הגדרות עודכנו
- `backup_created` - גיבוי נוצר
- `backup_restored` - גיבוי שוחזר

### System Events
- `system_notification` - הודעת מערכת
- `maintenance_mode` - מצב תחזוקה

## אינטגרציה עם API

### עדכון API Endpoints
כל ה-API endpoints הרלוונטיים עודכנו לשלוח הודעות WebSocket:

#### `POST /api/add-guess`
שולח הודעות:
- `guess_submitted`
- `leaderboard_updated`
- `pot_updated`

#### `PUT /api/update-match`
שולח הודעות:
- `match_updated`
- `score_calculated` (אם תוצאה עודכנה)
- `leaderboard_updated` (אם תוצאה עודכנה)

## שימוש בממשק

### דף הבית
- **RealTimeLeaderboard** - דירוג בזמן אמת במקום preview סטטי
- **NotificationToast** - הודעות מערכת
- **RealTimeIndicator** - בסטטוס bar (navbar)

### Navbar
- **RealTimeIndicator** - מציג סטטוס חיבור WebSocket

## הגדרת סביבה

### Dependencies שנוספו
```json
{
  "ws": "^8.18.1",
  "@types/ws": "^8.18.1",
  "socket.io": "^4.8.1",
  "socket.io-client": "^4.8.1"
}
```

### Environment Variables
אין צורך במשתני סביבה נוספים - המערכת משתמשת באותו URL של האפליקציה.

## ביצועים

### Connection Management
- **Auto-reconnect** - חיבור מחדש אוטומטי
- **Exponential backoff** - הפסקה מתגברת בין ניסיונות חיבור
- **Max reconnect attempts** - הגבלה על מספר ניסיונות
- **Ping/Pong** - בדיקת חיבורים חיים כל 30 שניות

### Memory Management
- **Connection cleanup** - ניקוי חיבורים מתים
- **Event handler cleanup** - ניקוי handlers ב-useEffect
- **Singleton pattern** - מניעת חיבורים מרובים

## בדיקות

### Manual Testing
1. פתח שני חלונות דפדפן
2. שלח ניחוש בחלון אחד
3. בדוק שהדירוג מתעדכן בחלון השני
4. עדכן תוצאת משחק בפאנל ניהול
5. בדוק שהניקוד מתעדכן בכל החלונות

### Connection Testing
1. נתק אינטרנט
2. בדוק שהסטטוס משתנה ל"מנותק"
3. חבר אינטרנט מחדש
4. בדוק שהחיבור מתחדש אוטומטית

## תכונות מתקדמות

### Real-time Features
- ✅ עדכוני דירוג בזמן אמת
- ✅ עדכוני קופה בזמן אמת
- ✅ עדכוני משחקים בזמן אמת
- ✅ הודעות מערכת בזמן אמת
- ✅ אינדיקטור חיבור WebSocket
- ✅ Auto-reconnect
- ✅ Connection state management

### Future Enhancements
- 🔄 Real-time chat
- 🔄 Live match updates
- 🔄 Push notifications
- 🔄 Voice notifications
- 🔄 Multi-tab synchronization

## בעיות ידועות

### Browser Compatibility
- דורש תמיכה ב-WebSocket (כל הדפדפנים המודרניים)
- לא עובד עם HTTP (דורש HTTPS או localhost)

### Network Issues
- אם WebSocket נכשל, המערכת ממשיכה לעבוד עם עדכונים ידניים
- Auto-reconnect מנסה להתחבר מחדש עד 10 פעמים

## סיכום

מערכת ה-WebSocket הוספה בהצלחה ומספקת:

1. **Real-time Updates** - עדכונים מיידיים לכל המשתמשים
2. **Better UX** - חוויית משתמש משופרת עם עדכונים חיים
3. **Connection Reliability** - חיבור יציב עם auto-reconnect
4. **Scalable Architecture** - ארכיטקטורה מודולרית וניתנת להרחבה
5. **Error Handling** - טיפול בשגיאות מתקדם
6. **Performance Optimized** - ביצועים מיטביים עם cleanup אוטומטי

המערכת מוכנה לשימוש ופועלת עם כל התכונות הקיימות של טוטו שלוש! 🚀
