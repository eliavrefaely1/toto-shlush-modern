// מערכת ניהול נתונים עם DB ישירות
class DataManager {
  constructor() {
    this._isInitialized = false;
  }

  generateId() {
    const rand = Math.random().toString(36).slice(2, 10);
    return `${Date.now()}_${rand}`;
  }

  // מזהה יציב לפי שם משתמש כדי לאחד בין מכשירים
  generateUserIdFromName(name) {
    const s = (name || '').toLowerCase().trim();
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i);
      h |= 0; // 32-bit
    }
    return `u_${Math.abs(h).toString(36)}`;
  }

  // טעינת נתונים מהשרת בלבד - ללא שמירה מקומית
  async loadDataFromServer() {
    try {
      const response = await fetch('/api/data', { cache: 'no-store' });
      if (response.ok) {
        const serverData = await response.json();
        return { ...this.getDefaultData(), ...serverData };
      }
    } catch (error) {
      console.error('Failed to load data from server:', error);
    }
    return this.getDefaultData();
  }

  // שמירה בשרת בלבד - ללא שמירה מקומית
  async saveDataToServer(dataToSave, options = {}) {
    try {
      const response = await fetch('/api/data', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        body: JSON.stringify(dataToSave)
      });
      
      if (response.ok) {
        return true;
      }
    } catch (error) {
      console.error('Failed to save data to server:', error);
    }
    return false;
  }

  // אתחול המערכת - טעינת נתונים מהשרת
  async initialize() {
    if (this._isInitialized) return;
    await this.loadDataFromServer();
    this._isInitialized = true;
  }

  // תיקון נתונים ישנים/חסרים
  normalizeData() {
    let changed = false;
    const beforeUsers = this.data.users?.length || 0;
    const beforeGuesses = this.data.userGuesses?.length || 0;

    // תיקון paymentStatus חסר למשתמשים והסרת כפילויות
    if (Array.isArray(this.data.users)) {
      const seen = new Set();
      this.data.users = this.data.users.filter(u => {
        if (!u.id || seen.has(u.id)) {
          changed = true;
          return false; // הסר משתמשים ללא ID או כפולים
        }
        seen.add(u.id);
        return true;
      }).map(u => {
        if (!u.paymentStatus) {
          changed = true;
          return { ...u, paymentStatus: 'unpaid' };
        }
        return u;
      });
    }

    // ודא שלכל משחק יש מזהה ושבוע מספרי
    if (Array.isArray(this.data.matches)) {
      const seen = new Set();
      this.data.matches = this.data.matches.map((m) => {
        const fixed = { ...m };
        if (!fixed.id || seen.has(fixed.id)) {
          fixed.id = this.generateId();
          changed = true;
        }
        seen.add(fixed.id);
        if (fixed.week != null && typeof fixed.week !== 'number') {
          const n = parseInt(fixed.week, 10);
          if (!Number.isNaN(n)) {
            fixed.week = n;
            changed = true;
          }
        }
        if (typeof fixed.time === 'string') {
          const s = fixed.time.trim();
          if (s && !s.includes(':')) {
            const digits = s.replace(/\D/g, '');
            if (digits.length === 4) {
              fixed.time = `${digits.slice(0,2)}:${digits.slice(2)}`;
              changed = true;
            } else if (digits.length === 3) {
              fixed.time = `0${digits[0]}:${digits.slice(1)}`;
              changed = true;
            }
          }
        }
        return fixed;
      });
    }

    // תיקון ניחושים כפולים והוספת paymentStatus חסר
    if (Array.isArray(this.data.userGuesses)) {
      const seen = new Set();
      this.data.userGuesses = this.data.userGuesses.filter(g => {
        if (!g.id || seen.has(g.id)) {
          changed = true;
          return false; // הסר ניחושים ללא ID או כפולים
        }
        seen.add(g.id);
        return true;
      }).map(g => {
        if (!g.paymentStatus) {
          changed = true;
          return { ...g, paymentStatus: 'unpaid' };
        }
        return g;
      });
    }

    if (changed) {
      const afterUsers = this.data.users?.length || 0;
      const afterGuesses = this.data.userGuesses?.length || 0;
      console.log(`DataManager.normalizeData: Cleaned up data - Users: ${beforeUsers} → ${afterUsers}, Guesses: ${beforeGuesses} → ${afterGuesses}`);
      // שמירה בשרת במקום localStorage
      this.saveDataToServer();
    }
  }

  getDefaultData() {
    return {
      adminPassword: '1234',
      entryFee: 35,
      totoFirstPrize: 8000000,
      submissionsLocked: false,
      countdownActive: false,
      countdownTarget: '',
      matches: [],
      users: [],
      userGuesses: [],
      pots: [],
      deletedWeeks: [],
      deletedGuessKeys: [],
      deletedUsers: []
    };
  }

  // טעינת נתונים מהשרת (ללא localStorage)
  async syncFromServer() {
    try {
      await this.loadDataFromServer();
    } catch (err) {
      console.error('[syncFromServer] failed', err);
    }
  }

  // שמירה בשרת (ללא localStorage)
  async mergeAndSave(options = {}) {
    try {
      // טען נתונים מהשרת
      const res = await fetch('/api/data', { cache: 'no-store' })
      const serverData = res.ok ? await res.json() : null
      
      // מיזוג עם הנתונים הנוכחיים
      const merged = this._mergeData(serverData || this.getDefaultData(), this.data)
      
      if (options.preferLocalSettings) {
        // כאשר פעולת אדמין משנה הגדרות – עדיף הערכים המקומיים
        // currentWeek מוסר - תמיד שבוע 1
        if (typeof this.data.entryFee !== 'undefined') merged.entryFee = this.data.entryFee
        if (typeof this.data.totoFirstPrize !== 'undefined') merged.totoFirstPrize = this.data.totoFirstPrize
        if (typeof this.data.adminPassword !== 'undefined') merged.adminPassword = this.data.adminPassword
        if (typeof this.data.submissionsLocked !== 'undefined') merged.submissionsLocked = this.data.submissionsLocked
        if (typeof this.data.countdownActive !== 'undefined') merged.countdownActive = this.data.countdownActive
        if (typeof this.data.countdownTarget !== 'undefined') merged.countdownTarget = this.data.countdownTarget
      }
      
      this.data = merged
      this.normalizeData()
      
      // שמור בשרת
      const putRes = await fetch('/api/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        body: JSON.stringify(merged)
      })
      
      if (putRes && putRes.ok) {
        // נקה דגלי מחיקה לאחר שמירה מוצלחת
        this.data.deletedWeeks = []
        this.data.deletedGuessKeys = []
        this.data.deletedUsers = []
        return true
      }
    } catch (err) {
      console.error('[mergeAndSave] failed', err);
    }
    return false
  }

  _mergeData(server, local) {
    const merged = { ...server }

    // הגדרות — השרת הוא מקור אמת כדי שכל המכשירים יראו אותו הדבר
    // currentWeek מוסר - תמיד שבוע 1
    merged.adminPassword = server.adminPassword || local.adminPassword || '1234'
    merged.entryFee = (server.entryFee ?? local.entryFee ?? 35)
    merged.submissionsLocked = (server.submissionsLocked ?? local.submissionsLocked ?? false)
    merged.countdownActive = (server.countdownActive ?? local.countdownActive ?? false)
    merged.countdownTarget = (server.countdownTarget ?? local.countdownTarget ?? '')

    // משחקים — בסיס מהשרת, אך עדכונים מקומיים באותו match.id גוברים; כבד מחיקות שבועות
    const srvMatches = Array.isArray(server.matches) ? server.matches : []
    const locMatches = Array.isArray(local.matches) ? local.matches : []
    const deletedWeeks = (local.deletedWeeks || []).map(Number)

    // קבץ לפי שבוע
    const groupByWeek = (arr) => {
      const map = new Map()
      arr.forEach(m => {
        if (!m) return
        const w = Number(m.week)
        if (!map.has(w)) map.set(w, [])
        map.get(w).push(m)
      })
      return map
    }

    const srvByWeek = groupByWeek(srvMatches)
    const locByWeek = groupByWeek(locMatches)

    const allWeeks = new Set([...srvByWeek.keys(), ...locByWeek.keys()])
    const mergedMatches = []

    allWeeks.forEach(w => {
      if (deletedWeeks.includes(Number(w))) {
        return // מחיקת שבוע שלם
      }
      const srvList = srvByWeek.get(w) || []
      const locList = locByWeek.get(w) || []

      // מפות לפי מזהה עם הכרעה לפי updatedAt/createdAt
      const byId = new Map(srvList.map(m => [m.id, m]))
      locList.forEach(m => {
        if (!m || !m.id) return
        const prev = byId.get(m.id)
        if (!prev) { byId.set(m.id, m); return }
        const tPrev = new Date(prev.updatedAt || prev.createdAt || 0).getTime()
        const tNew = new Date(m.updatedAt || m.createdAt || 0).getTime()
        if (tNew >= tPrev) {
          byId.set(m.id, { ...prev, ...m })
        }
      })
      // סדר: שמור על סדר השרת, הוסף מקומיים חדשים בסוף לפי הסדר המקומי
      const idsSeen = new Set()
      const list = []
      srvList.forEach(m => { const mm = byId.get(m.id) || m; list.push(mm); idsSeen.add(mm.id) })
      locList.forEach(m => { if (m && m.id && !idsSeen.has(m.id)) list.push(m) })
      mergedMatches.push(...list)
    })

    merged.matches = mergedMatches

    // משתמשים — מאחדים לפי ID קודם, ואז לפי name; מכבדים מחיקות גם מהשרת וגם מקומי (איחוד)
    const deletedUsers = new Set([
      ...((server.deletedUsers || []).map(s => String(s).toLowerCase().trim())),
      ...((local.deletedUsers || []).map(s => String(s).toLowerCase().trim()))
    ])
    
    // קודם מאחדים לפי ID כדי למנוע כפילות של אותו משתמש
    const byId = new Map()
    ;[...(server.users || []), ...(local.users || [])].forEach(u => {
      if (!u || !u.id) return
      const key = (u.name || '').toLowerCase().trim()
      if (deletedUsers.has(key)) return
      
      const existing = byId.get(u.id)
      if (!existing) {
        byId.set(u.id, u)
      } else {
        // אם יש משתמש קיים עם אותו ID, בדוק מי יותר עדכני לפי updatedAt
        const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime()
        const newTime = new Date(u.updatedAt || u.createdAt || 0).getTime()
        if (newTime >= existingTime) {
          byId.set(u.id, { ...existing, ...u })
        }
      }
    })
    
    // עכשיו מאחדים לפי name למקרים של users ללא ID או עם ID זהה
    const byName = new Map()
    Array.from(byId.values()).forEach(u => {
      if (!u) return
      const key = (u.name || '').toLowerCase().trim()
      if (deletedUsers.has(key)) return
      
      const existing = byName.get(key)
      if (!existing) {
        byName.set(key, u)
      } else {
        // אם יש משתמש קיים עם אותו שם, בדוק מי יותר עדכני לפי updatedAt
        const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime()
        const newTime = new Date(u.updatedAt || u.createdAt || 0).getTime()
        if (newTime >= existingTime) {
          byName.set(key, { ...existing, ...u })
        }
      }
    })
    merged.users = Array.from(byName.values())

    // ניחושים — איחוד לפי (name, week) תוך כיבוד מחיקות
    const gKey = g => `${(g.name||'').toLowerCase().trim()}__${g.week}`
    const deletedGuessKeys = new Set([
      ...((server.deletedGuessKeys || []).map(k => String(k).toLowerCase())),
      ...((local.deletedGuessKeys || []).map(k => String(k).toLowerCase()))
    ])
    const guessesMap = new Map()
    const allGuesses = [...(server.userGuesses || []), ...(local.userGuesses || [])]
    allGuesses.forEach(g => {
      if (!g) return
      const key = gKey(g)
      if (deletedGuessKeys.has(key)) return
      const prev = guessesMap.get(key)
      if (!prev) { guessesMap.set(key, g); return }
      const tPrev = new Date(prev.updatedAt || prev.createdAt || 0).getTime()
      const tNew = new Date(g.updatedAt || g.createdAt || 0).getTime()
      // אם הזמן שווה, העדף מקומי (שני האחרון במערך), אחרת העדף המאוחר יותר
      if (tNew >= tPrev) guessesMap.set(key, g)
    })
    merged.userGuesses = Array.from(guessesMap.values())

    // pots לא נשמר כרשימה — מחשבים דינמית; נשמר אם קיים
    merged.pots = server.pots || local.pots || []

    // שמור דגלי מחיקה כדי שיתפזרו לכל המכשירים
    merged.deletedWeeks = Array.from(new Set([...(server.deletedWeeks || []).map(Number), ...(local.deletedWeeks || []).map(Number)]))
    merged.deletedGuessKeys = Array.from(deletedGuessKeys)
    merged.deletedUsers = Array.from(deletedUsers)
    return merged
  }

  // ניהול משחקים
  async getMatches(week = null) {
    // תמיד שבוע 1 - טעינה ישירה מהשרת
    const targetNum = 1;
    const data = await this.loadDataFromServer();
    const matches = (data.matches || []).filter(match => Number(match.week) === targetNum);
    return matches;
  }

  async addMatch(match) {
    const newMatch = {
      id: match.id || this.generateId(),
      week: 1,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      // אל תקבע ברירת מחדל של היום — אם אין תאריך בקלט, השאר ריק
      date: match.date || '',
      result: match.result || '',
      category: 'טוטו 16',
      createdAt: match.createdAt || new Date().toISOString(),
      updatedAt: match.updatedAt || new Date().toISOString(),
      ...match
    };
    
    // טען נתונים מהשרת
    const data = await this.loadDataFromServer();
    data.matches.push(newMatch);
    await this.saveDataToServer(data);
    return newMatch;
  }

  async updateMatch(matchId, updates) {
    const data = await this.loadDataFromServer();
    const matchIndex = data.matches.findIndex(m => m.id === matchId);
    if (matchIndex !== -1) {
      data.matches[matchIndex] = { ...data.matches[matchIndex], ...updates, updatedAt: new Date().toISOString() };
      await this.saveDataToServer(data);
      return data.matches[matchIndex];
    }
    return null;
  }

  async deleteMatch(matchId) {
    const data = await this.loadDataFromServer();
    data.matches = data.matches.filter(m => m.id !== matchId);
    await this.saveDataToServer(data);
  }

  async clearAllMatches(week = null) {
    // תמיד שבוע 1
    const w = 1;
    const data = await this.loadDataFromServer();
    data.matches = data.matches.filter(m => Number(m.week) !== w);
    await this.saveDataToServer(data);
  }

  // ניהול משתמשים
  async getUsers() {
    const data = await this.loadDataFromServer();
    return data.users || [];
  }

  async addUser(user) {
    const data = await this.loadDataFromServer();
    const existing = (data.users || []).find(u => (u.name || '').toLowerCase().trim() === (user.name || '').toLowerCase().trim())
    if (existing) return existing;
    const newUser = {
      id: this.generateUserIdFromName(user.name),
      name: user.name,
      isAdmin: user.isAdmin || false,
      paymentStatus: 'unpaid', // תמיד התחל עם 'unpaid' למשתמש חדש
      createdAt: new Date().toISOString(),
      ...user,
      // ודא שאפילו אם user מכיל paymentStatus, הוא יהיה 'unpaid'
      paymentStatus: 'unpaid'
    };
    data.users.push(newUser);
    await this.saveDataToServer(data);
    return newUser;
  }

  getUserById(userId, data = null) {
    if (data) {
      return data.users.find(u => u.id === userId);
    }
    // אם לא קיבלנו נתונים, נחזיר null
    return null;
  }

  // עדכון סטטוס תשלום
  async updateUserPaymentStatus(userId, paymentStatus) {
    const data = await this.loadDataFromServer();
    const userIndex = data.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      const now = new Date().toISOString();
      data.users[userIndex].paymentStatus = paymentStatus;
      data.users[userIndex].updatedAt = now;
      await this.saveDataToServer(data);
      return data.users[userIndex];
    }
    return null;
  }

  // שינוי שם משתמש
  async renameUser(oldName, newName) {
    const data = await this.loadDataFromServer();
    
    // בדיקה שהשם החדש לא קיים
    const existingUser = data.users.find(u => 
      u.name.toLowerCase().trim() === newName.toLowerCase().trim()
    );
    if (existingUser) {
      throw new Error(`השם "${newName}" כבר קיים במערכת`);
    }
    
    // מצא את המשתמש הישן
    const user = data.users.find(u => 
      u.name.toLowerCase().trim() === oldName.toLowerCase().trim()
    );
    if (!user) {
      throw new Error(`המשתמש "${oldName}" לא נמצא`);
    }
    
    // עדכן את השם
    const oldNameValue = user.name;
    user.name = newName;
    user.updatedAt = new Date().toISOString();
    
    // עדכן את כל הניחושים
    data.userGuesses = (data.userGuesses || []).map(g => {
      if (g.name === oldNameValue) {
        return { ...g, name: newName, updatedAt: new Date().toISOString() };
      }
      return g;
    });
    
    // שמור בשרת
    await this.saveDataToServer(data);
    
    return user;
  }

  // מחיקת משתמש וכל הניחושים שלו בכל השבועות
  async deleteUser(userIdOrName) {
    const data = await this.loadDataFromServer();
    const beforeUsers = data.users.length;
    let target = null;
    let nameLower = '';
    let idStr = '';
    if (typeof userIdOrName === 'string') {
      idStr = userIdOrName;
      target = this.getUserById(userIdOrName, data);
      if (!target) {
        // נסה כשם
        nameLower = userIdOrName.toLowerCase().trim();
        target = (data.users || []).find(u => (u.name||'').toLowerCase().trim() === nameLower) || null;
      }
    } else if (userIdOrName && userIdOrName.id) {
      target = this.getUserById(userIdOrName.id, data) || userIdOrName;
    }

    if (!target) {
      // נסה לאתר לפי רשומת ניחוש קיימת
      const g = (data.userGuesses || []).find(gg => gg.userId === idStr || (String(gg.name||'').toLowerCase().trim() === (nameLower || '').toLowerCase()))
      if (g) {
        nameLower = String(g.name || '').toLowerCase().trim();
        target = { id: g.userId, name: g.name };
      }
    }

    if (!target && !nameLower) return { usersRemoved: 0, guessesRemoved: 0 };

    nameLower = nameLower || String(target.name || '').toLowerCase().trim();

    // הסר את המשתמש מרשימת המשתמשים
    data.users = (data.users || []).filter(u => u.id !== target.id && (String(u.name||'').toLowerCase().trim() !== nameLower));

    // רשום מחיקה כדי שתגבר במיזוג מול השרת
    if (nameLower) {
      if (!Array.isArray(data.deletedUsers)) data.deletedUsers = []
      if (!data.deletedUsers.includes(nameLower)) data.deletedUsers.push(nameLower)
    }

    // סמן ומחק את כל הניחושים של המשתמש בכל השבועות
    (data.userGuesses || []).forEach(g => {
      if (g.userId === target.id || (String(g.name||'').toLowerCase().trim() === nameLower)) {
        const key = `${(g.name||'').toLowerCase().trim()}__${g.week}`
        if (!data.deletedGuessKeys.includes(key)) data.deletedGuessKeys.push(key)
      }
    })
    const beforeGuesses = (data.userGuesses || []).length;
    data.userGuesses = (data.userGuesses || []).filter(g => !(g.userId === target.id || (String(g.name||'').toLowerCase().trim() === nameLower)));
    const guessesRemoved = beforeGuesses - data.userGuesses.length;

    await this.saveDataToServer(data);
    return { usersRemoved: beforeUsers - data.users.length, guessesRemoved };
  }

  // ניהול ניחושים
  async getUserGuesses(week = null) {
    // תמיד שבוע 1 - טעינה ישירה מהשרת
    const w = 1;
    const data = await this.loadDataFromServer();
    return (data.userGuesses || []).filter(guess => Number(guess.week) === w);
  }

  async addUserGuess(guess) {
    const newGuess = {
      id: Date.now().toString(),
      userId: guess.userId,
      name: guess.name,
      week: 1,
      guesses: guess.guesses || Array(16).fill(''),
      score: 0,
      paymentStatus: 'unpaid', // מצב שולם לכל ניחוש בנפרד
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...guess
    };

    // טען נתונים מהשרת
    const data = await this.loadDataFromServer();
    
    // מחיקת ניחוש קודם אם קיים
    data.userGuesses = (data.userGuesses || []).filter(
      g => !(
        (g.userId === newGuess.userId || (g.name||'').toLowerCase().trim() === (newGuess.name||'').toLowerCase().trim())
        && g.week === newGuess.week
      )
    );

    data.userGuesses.push(newGuess);
    await this.saveDataToServer(data);
    return newGuess;
  }

  async updateUserGuess(guessId, updates) {
    const data = await this.loadDataFromServer();
    const guessIndex = data.userGuesses.findIndex(g => g.id === guessId);
    if (guessIndex !== -1) {
      data.userGuesses[guessIndex] = { ...data.userGuesses[guessIndex], ...updates, updatedAt: new Date().toISOString() };
      await this.saveDataToServer(data);
      return data.userGuesses[guessIndex];
    }
    return null;
  }

  // עדכון סטטוס תשלום לניחוש ספציפי
  async updateGuessPaymentStatus(guessId, paymentStatus) {
    const data = await this.loadDataFromServer();
    const guessIndex = data.userGuesses.findIndex(g => g.id === guessId);
    if (guessIndex !== -1) {
      const now = new Date().toISOString();
      data.userGuesses[guessIndex].paymentStatus = paymentStatus;
      data.userGuesses[guessIndex].updatedAt = now;
      await this.saveDataToServer(data);
      return data.userGuesses[guessIndex];
    }
    return null;
  }

  // מחיקת ניחושים
  async deleteUserGuess(guessId) {
    const data = await this.loadDataFromServer();
    const before = data.userGuesses.length;
    const toDelete = data.userGuesses.find(g => g.id === guessId)
    if (toDelete) {
      const key = `${(toDelete.name||'').toLowerCase().trim()}__${toDelete.week}`
      if (!data.deletedGuessKeys.includes(key)) data.deletedGuessKeys.push(key)
    }
    data.userGuesses = data.userGuesses.filter(g => g.id !== guessId);
    const after = data.userGuesses.length;
    if (after !== before) await this.saveDataToServer(data);
    return before - after;
  }

  async deleteUserGuessesByUserAndWeek(userIdOrName, week = null) {
    // תמיד שבוע 1
    const w = 1;
    const data = await this.loadDataFromServer();
    const before = data.userGuesses.length;

    // תמיכה גם במחיקה לפי שם (ליישור לאיחוד החדש לפי name)
    let nameLower = '';
    const candidate = this.getUserById(userIdOrName, data);
    if (candidate && candidate.name) {
      nameLower = String(candidate.name).toLowerCase().trim();
    } else if (typeof userIdOrName === 'string') {
      // ייתכן שקיבלנו שם במקום מזהה
      nameLower = userIdOrName.toLowerCase().trim();
    }

    if (nameLower) {
      const key = `${nameLower}__${w}`
      if (!data.deletedGuessKeys.includes(key)) data.deletedGuessKeys.push(key)
    }

    data.userGuesses = data.userGuesses.filter(g => {
      const sameUser = (g.userId === userIdOrName) || (String(g.name || '').toLowerCase().trim() === nameLower);
      const sameWeek = Number(g.week) === w;
      return !(sameUser && sameWeek);
    });

    const after = data.userGuesses.length;
    if (after !== before) await this.saveDataToServer(data);
    return before - after;
  }

  async clearAllGuesses(week = null) {
    const before = this.data.userGuesses.length;
    // תמיד שבוע 1
    const w = 1;
    // סמן את כל מפתחות השבוע למחיקה
    (this.data.userGuesses || []).forEach(g => {
      if (Number(g.week) === w) {
        const key = `${(g.name||'').toLowerCase().trim()}__${w}`
        if (!this.data.deletedGuessKeys.includes(key)) this.data.deletedGuessKeys.push(key)
      }
    })
    this.data.userGuesses = this.data.userGuesses.filter(g => Number(g.week) !== w);
    const after = this.data.userGuesses.length;
    if (after !== before) await this.saveDataToServer();
    return before - after;
  }

  // חישוב ניקוד
  async calculateScores(week = null) {
    // תמיד שבוע 1
    const matches = this.getMatches(1);
    const guesses = this.getUserGuesses(1);

    for (const guess of guesses) {
      let score = 0;
      const correctGuesses = [];

      matches.forEach((match, index) => {
        const isCorrect = match.result && guess.guesses[index] === match.result;
        if (!match.result) {
          correctGuesses.push(false);
        } else {
          correctGuesses.push(isCorrect);
        }
        if (isCorrect) {
          score++;
        }
      });

      if (guess.score !== score || !guess.correct) {
        await this.updateUserGuess(guess.id, { score, correct: correctGuesses });
      }
    }

    return this.getUserGuesses(targetWeek);
  }

  // ניהול קופה
  async getPot(week = null) {
    // תמיד שבוע 1 - טעינה ישירה מהשרת
    const guesses = await this.getUserGuesses(1);
    const data = await this.loadDataFromServer();
    const numOfPlayers = guesses.length;
    const amountPerPlayer = data.entryFee || 35;
    const totalAmount = numOfPlayers * amountPerPlayer;

    return {
      numOfPlayers,
      amountPerPlayer,
      totalAmount
    };
  }

  // הגדרות
  async getSettings() {
    const data = await this.loadDataFromServer();
    return {
      adminPassword: data.adminPassword || '1234',
      entryFee: data.entryFee || 35,
      totoFirstPrize: data.totoFirstPrize || 8000000,
      submissionsLocked: !!data.submissionsLocked,
      countdownActive: !!data.countdownActive,
      countdownTarget: data.countdownTarget || ''
    };
  }

  async updateSettings(settings) {
    // currentWeek מוסר - תמיד שבוע 1
    const data = await this.loadDataFromServer();
    
    if (Object.prototype.hasOwnProperty.call(settings, 'adminPassword')) {
      data.adminPassword = settings.adminPassword;
    }
    if (Object.prototype.hasOwnProperty.call(settings, 'entryFee')) {
      data.entryFee = settings.entryFee;
    }
    if (Object.prototype.hasOwnProperty.call(settings, 'totoFirstPrize')) {
      data.totoFirstPrize = settings.totoFirstPrize;
    }
    if (Object.prototype.hasOwnProperty.call(settings, 'submissionsLocked')) {
      data.submissionsLocked = !!settings.submissionsLocked;
    }
    if (Object.prototype.hasOwnProperty.call(settings, 'countdownActive')) {
      data.countdownActive = !!settings.countdownActive;
    }
    if (Object.prototype.hasOwnProperty.call(settings, 'countdownTarget')) {
      data.countdownTarget = settings.countdownTarget;
    }
    // שמור בשרת
    await this.saveDataToServer(data);
  }

  // אימות מנהל
  async authenticateAdmin(password) {
    const data = await this.loadDataFromServer();
    return password === data.adminPassword;
  }

  // יצירת 16 משחקים ברירת מחדל
  async createDefaultMatches(week = null) {
    // תמיד שבוע 1
    const targetWeek = 1;
    const existingMatches = await this.getMatches(targetWeek);

    if (existingMatches.length >= 16) {
      for (let index = 0; index < existingMatches.length; index++) {
        const match = existingMatches[index];
        if (!match.name) {
          match.name = `Match ${index + 1}`;
          match.homeTeam = match.homeTeam || `Home Team ${index + 1}`;
          match.awayTeam = match.awayTeam || `Away Team ${index + 1}`;
          await this.updateMatch(match.id, match);
        }
      }
      const updatedMatches = await this.getMatches(targetWeek);
      return updatedMatches;
    }

    const newMatches = [];
    for (let i = existingMatches.length + 1; i <= 16; i++) {
      const match = {
        week: targetWeek,
        name: `Match ${i}`,
        homeTeam: `Home Team ${i}`,
        awayTeam: `Away Team ${i}`,
        result: '',
        category: 'טוטו 16'
      };
      newMatches.push(match);
    }

    for (const match of newMatches) {
      await this.addMatch(match);
    }
    const updatedMatches = this.getMatches(targetWeek);
    return updatedMatches;
  }

  // קבלת דירוג
  async getLeaderboard(week = null) {
    // תמיד שבוע 1
    const guesses = await this.calculateScores(1);
    return guesses
      .map(guess => {
        const user = this.getUserById(guess.userId);
        return {
          ...guess,
          user: user || { name: guess.name, phone: guess.phone }
        };
      })
      .sort((a, b) => b.score - a.score);
  }
}

// יצירת instance גלובלי
const dataManager = new DataManager();
export default dataManager;
