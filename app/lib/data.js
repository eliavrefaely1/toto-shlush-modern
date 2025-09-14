// מערכת ניהול נתונים עם localStorage
class DataManager {
  constructor() {
    this.storageKey = 'toto-shlush-data';
    this.data = this.loadData();
    this.normalizeData();
    this._syncTimer = null;
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

  loadData() {
    if (typeof window === 'undefined') return this.getDefaultData();
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : this.getDefaultData();
    } catch (error) {
      // suppressed console output
      return this.getDefaultData();
    }
  }

  saveData(router) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      // Use router.refresh() if router is provided
      if (router) {
        router.refresh();
      }
      // Schedule sync to server (debounced) so all devices see the same data
      this._scheduleServerSync();
    } catch (error) {
      // suppressed console output
    }
  }

  _scheduleServerSync(delay = 300) {
    try {
      if (this._syncTimer) clearTimeout(this._syncTimer);
      this._syncTimer = setTimeout(() => {
        this._syncTimer = null;
        this.mergeAndSave?.();
      }, delay);
    } catch (_) { /* noop */ }
  }

  // תיקון נתונים ישנים/חסרים
  normalizeData() {
    let changed = false;

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

    if (changed) {
      this.saveData();
    }
  }

  getDefaultData() {
    return {
      currentWeek: 1,
      adminPassword: '1234',
      entryFee: 35,
      submissionsLocked: false,
      matches: [],
      users: [],
      userGuesses: [],
      pots: [],
      deletedWeeks: [],
      deletedGuessKeys: [],
      deletedUsers: []
    };
  }

  // סנכרון מהשרת (KV) ללקוח
  async syncFromServer() {
    // מושך מהשרת, מאחד מול מקומי, ושומר מקומי; לא מוחק נתונים אם השרת ריק
    try {
      const week = Number(this.data?.currentWeek || 1)
      // בקשה ממוזערת לפי שבוע ושדות נחוצים
      let res = await fetch(`/api/data?week=${encodeURIComponent(week)}&fields=settings,matches,guesses,users`, { cache: 'no-store' })
      if (!res.ok) return
      let serverData = await res.json()

      // אם השרת מצביע על שבוע נוכחי אחר – בקשת השלמה לשבוע הנכון
      const serverWeek = Number(serverData?.currentWeek ?? serverData?.settings?.currentWeek)
      if (serverWeek && serverWeek !== week) {
        const res2 = await fetch(`/api/data?week=${encodeURIComponent(serverWeek)}&fields=settings,matches,guesses,users`, { cache: 'no-store' })
        if (res2.ok) serverData = await res2.json()
      }

      if (serverData && typeof serverData === 'object') {
        // מיזוג דו-כיווני: שרת מול מקומי
        const merged = this._mergeData(serverData || this.getDefaultData(), this.data || this.getDefaultData())
        this.data = merged
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.storageKey, JSON.stringify(this.data))
        }
      }
    } catch (err) {
      // offline/אין API — השאר את הנתונים המקומיים
      if (typeof window !== 'undefined') {
        const u = new URL(window.location.href);
        if (u.searchParams.get('diag') === '1') {
          console.error('[syncFromServer] failed', err);
        }
      }
    }
  }

  // מיזוג נתונים מקומי עם נתוני השרת ושמירה ל‑KV
  async mergeAndSave(options = {}) {
    try {
      const res = await fetch('/api/data', { cache: 'no-store' })
      const serverData = res.ok ? await res.json() : null
      const merged = this._mergeData(serverData || this.getDefaultData(), this.data)
      this.data = merged
      // שמור מקומית לפני ניסיון שרת
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(merged))
      }
      const putRes = await fetch('/api/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        body: JSON.stringify(merged)
      })
      if (putRes && putRes.ok) {
        // לאחר שהשרת עדכן, נקה דגלי מחיקה מקומיים
        this.data.deletedWeeks = []
        this.data.deletedGuessKeys = []
        this.data.deletedUsers = []
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.storageKey, JSON.stringify(this.data))
        }
      }
    } catch (err) {
      // offline/אין KV — יתעדכן בפעם הבאה
      if (typeof window !== 'undefined') {
        const u = new URL(window.location.href);
        if (u.searchParams.get('diag') === '1') {
          console.error('[mergeAndSave] failed', err);
        }
      }
    }
  }

  _mergeData(server, local) {
    const merged = { ...server }

    // הגדרות — השרת הוא מקור אמת כדי שכל המכשירים יראו אותו הדבר
    merged.currentWeek = (server.currentWeek ?? local.currentWeek ?? 1)
    merged.adminPassword = server.adminPassword || local.adminPassword || '1234'
    merged.entryFee = (server.entryFee ?? local.entryFee ?? 35)
    merged.submissionsLocked = (server.submissionsLocked ?? local.submissionsLocked ?? false)

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

    // משתמשים — מאחדים לפי name; מכבדים מחיקות גם מהשרת וגם מקומי (איחוד)
    const deletedUsers = new Set([
      ...((server.deletedUsers || []).map(s => String(s).toLowerCase().trim())),
      ...((local.deletedUsers || []).map(s => String(s).toLowerCase().trim()))
    ])
    const byName = new Map()
    ;[...(server.users || []), ...(local.users || [])].forEach(u => {
      if (!u) return
      const key = (u.name || '').toLowerCase().trim()
      if (deletedUsers.has(key)) return
      if (!byName.has(key)) byName.set(key, u)
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
  getMatches(week = null) {
    const targetWeek = (week ?? this.data.currentWeek);
    const targetNum = Number(targetWeek);
    const matches = this.data.matches.filter(match => Number(match.week) === targetNum);
    return matches;
  }

  addMatch(match) {
    const newMatch = {
      id: match.id || this.generateId(),
      week: match.week || this.data.currentWeek,
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
    this.data.matches.push(newMatch);
    this.saveData();
    return newMatch;
  }

  updateMatch(matchId, updates) {
    const matchIndex = this.data.matches.findIndex(m => m.id === matchId);
    if (matchIndex !== -1) {
      this.data.matches[matchIndex] = { ...this.data.matches[matchIndex], ...updates, updatedAt: new Date().toISOString() };
      this.saveData();
      return this.data.matches[matchIndex];
    }
    return null;
  }

  deleteMatch(matchId) {
    this.data.matches = this.data.matches.filter(m => m.id !== matchId);
    this.saveData();
  }

  clearAllMatches(week = null) {
    if (week !== null && week !== undefined) {
      const w = Number(week);
      this.data.matches = this.data.matches.filter(m => Number(m.week) !== w);
      if (!this.data.deletedWeeks.includes(w)) this.data.deletedWeeks.push(w);
    } else {
      this.data.matches = [];
      const weeks = new Set([
        ...this.data.userGuesses.map(g => Number(g.week)),
        ...this.data.matches.map(m => Number(m.week))
      ]);
      this.data.deletedWeeks = Array.from(weeks);
    }
    this.saveData();
  }

  // ניהול משתמשים
  getUsers() {
    return this.data.users;
  }

  addUser(user) {
    const existing = (this.data.users || []).find(u => (u.name || '').toLowerCase().trim() === (user.name || '').toLowerCase().trim())
    if (existing) return existing;
    const newUser = {
      id: this.generateUserIdFromName(user.name),
      name: user.name,
      isAdmin: user.isAdmin || false,
      createdAt: new Date().toISOString(),
      ...user
    };
    this.data.users.push(newUser);
    this.saveData();
    return newUser;
  }

  getUserById(userId) {
    return this.data.users.find(u => u.id === userId);
  }

  // מחיקת משתמש וכל הניחושים שלו בכל השבועות
  deleteUser(userIdOrName) {
    const beforeUsers = this.data.users.length;
    let target = null;
    let nameLower = '';
    let idStr = '';
    if (typeof userIdOrName === 'string') {
      idStr = userIdOrName;
      target = this.getUserById(userIdOrName);
      if (!target) {
        // נסה כשם
        nameLower = userIdOrName.toLowerCase().trim();
        target = (this.data.users || []).find(u => (u.name||'').toLowerCase().trim() === nameLower) || null;
      }
    } else if (userIdOrName && userIdOrName.id) {
      target = this.getUserById(userIdOrName.id) || userIdOrName;
    }

    if (!target) {
      // נסה לאתר לפי רשומת ניחוש קיימת
      const g = (this.data.userGuesses || []).find(gg => gg.userId === idStr || (String(gg.name||'').toLowerCase().trim() === (nameLower || '').toLowerCase()))
      if (g) {
        nameLower = String(g.name || '').toLowerCase().trim();
        target = { id: g.userId, name: g.name };
      }
    }

    if (!target && !nameLower) return { usersRemoved: 0, guessesRemoved: 0 };

    nameLower = nameLower || String(target.name || '').toLowerCase().trim();

    // הסר את המשתמש מרשימת המשתמשים
    this.data.users = (this.data.users || []).filter(u => u.id !== target.id && (String(u.name||'').toLowerCase().trim() !== nameLower));

    // רשום מחיקה כדי שתגבר במיזוג מול השרת
    if (nameLower) {
      if (!Array.isArray(this.data.deletedUsers)) this.data.deletedUsers = []
      if (!this.data.deletedUsers.includes(nameLower)) this.data.deletedUsers.push(nameLower)
    }

    // סמן ומחק את כל הניחושים של המשתמש בכל השבועות
    (this.data.userGuesses || []).forEach(g => {
      if (g.userId === target.id || (String(g.name||'').toLowerCase().trim() === nameLower)) {
        const key = `${(g.name||'').toLowerCase().trim()}__${g.week}`
        if (!this.data.deletedGuessKeys.includes(key)) this.data.deletedGuessKeys.push(key)
      }
    })
    const beforeGuesses = (this.data.userGuesses || []).length;
    this.data.userGuesses = (this.data.userGuesses || []).filter(g => !(g.userId === target.id || (String(g.name||'').toLowerCase().trim() === nameLower)));
    const guessesRemoved = beforeGuesses - this.data.userGuesses.length;

    this.saveData();
    return { usersRemoved: beforeUsers - this.data.users.length, guessesRemoved };
  }

  // ניהול ניחושים
  getUserGuesses(week = null) {
    const targetWeek = (week ?? this.data.currentWeek);
    const w = Number(targetWeek);
    return this.data.userGuesses.filter(guess => Number(guess.week) === w);
  }

  addUserGuess(guess) {
    const newGuess = {
      id: Date.now().toString(),
      userId: guess.userId,
      name: guess.name,
      week: guess.week || this.data.currentWeek,
      guesses: guess.guesses || Array(16).fill(''),
      score: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...guess
    };

    // מחיקת ניחוש קודם אם קיים
    this.data.userGuesses = this.data.userGuesses.filter(
      g => !(
        (g.userId === newGuess.userId || (g.name||'').toLowerCase().trim() === (newGuess.name||'').toLowerCase().trim())
        && g.week === newGuess.week
      )
    );

    this.data.userGuesses.push(newGuess);
    this.saveData();
    return newGuess;
  }

  updateUserGuess(guessId, updates) {
    const guessIndex = this.data.userGuesses.findIndex(g => g.id === guessId);
    if (guessIndex !== -1) {
      this.data.userGuesses[guessIndex] = { ...this.data.userGuesses[guessIndex], ...updates, updatedAt: new Date().toISOString() };
      this.saveData();
      return this.data.userGuesses[guessIndex];
    }
    return null;
  }

  // מחיקת ניחושים
  deleteUserGuess(guessId) {
    const before = this.data.userGuesses.length;
    const toDelete = this.data.userGuesses.find(g => g.id === guessId)
    if (toDelete) {
      const key = `${(toDelete.name||'').toLowerCase().trim()}__${toDelete.week}`
      if (!this.data.deletedGuessKeys.includes(key)) this.data.deletedGuessKeys.push(key)
    }
    this.data.userGuesses = this.data.userGuesses.filter(g => g.id !== guessId);
    const after = this.data.userGuesses.length;
    if (after !== before) this.saveData();
    return before - after;
  }

  deleteUserGuessesByUserAndWeek(userIdOrName, week = null) {
    const targetWeek = (week ?? this.data.currentWeek);
    const w = Number(targetWeek);
    const before = this.data.userGuesses.length;

    // תמיכה גם במחיקה לפי שם (ליישור לאיחוד החדש לפי name)
    let nameLower = '';
    const candidate = this.getUserById(userIdOrName);
    if (candidate && candidate.name) {
      nameLower = String(candidate.name).toLowerCase().trim();
    } else if (typeof userIdOrName === 'string') {
      // ייתכן שקיבלנו שם במקום מזהה
      nameLower = userIdOrName.toLowerCase().trim();
    }

    if (nameLower) {
      const key = `${nameLower}__${w}`
      if (!this.data.deletedGuessKeys.includes(key)) this.data.deletedGuessKeys.push(key)
    }

    this.data.userGuesses = this.data.userGuesses.filter(g => {
      const sameUser = (g.userId === userIdOrName) || (String(g.name || '').toLowerCase().trim() === nameLower);
      const sameWeek = Number(g.week) === w;
      return !(sameUser && sameWeek);
    });

    const after = this.data.userGuesses.length;
    if (after !== before) this.saveData();
    return before - after;
  }

  clearAllGuesses(week = null) {
    const before = this.data.userGuesses.length;
    if (week !== null && week !== undefined) {
      const w = Number(week);
      // סמן את כל מפתחות השבוע למחיקה
      (this.data.userGuesses || []).forEach(g => {
        if (Number(g.week) === w) {
          const key = `${(g.name||'').toLowerCase().trim()}__${w}`
          if (!this.data.deletedGuessKeys.includes(key)) this.data.deletedGuessKeys.push(key)
        }
      })
      this.data.userGuesses = this.data.userGuesses.filter(g => Number(g.week) !== w);
    } else {
      // מחיקה מוחלטת — סמן את כל המפתחות
      (this.data.userGuesses || []).forEach(g => {
        const key = `${(g.name||'').toLowerCase().trim()}__${g.week}`
        if (!this.data.deletedGuessKeys.includes(key)) this.data.deletedGuessKeys.push(key)
      })
      this.data.userGuesses = [];
    }
    const after = this.data.userGuesses.length;
    if (after !== before) this.saveData();
    return before - after;
  }

  // חישוב ניקוד
  calculateScores(week = null) {
    const targetWeek = (week ?? this.data.currentWeek);
    const matches = this.getMatches(targetWeek);
    const guesses = this.getUserGuesses(targetWeek);

    guesses.forEach(guess => {
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
        this.updateUserGuess(guess.id, { score, correct: correctGuesses });
      }
    });

    return this.getUserGuesses(targetWeek);
  }

  // ניהול קופה
  getPot(week = null) {
    const targetWeek = (week ?? this.data.currentWeek);
    const guesses = this.getUserGuesses(targetWeek);
    const numOfPlayers = guesses.length;
    const amountPerPlayer = this.data.entryFee;
    const totalAmount = numOfPlayers * amountPerPlayer;

    return {
      week: targetWeek,
      numOfPlayers,
      amountPerPlayer,
      totalAmount
    };
  }

  // הגדרות
  getSettings() {
    return {
      currentWeek: this.data.currentWeek,
      adminPassword: this.data.adminPassword,
      entryFee: this.data.entryFee,
      submissionsLocked: !!this.data.submissionsLocked
    };
  }

  updateSettings(settings) {
    if (Object.prototype.hasOwnProperty.call(settings, 'currentWeek')) {
      this.data.currentWeek = settings.currentWeek;
    }
    if (Object.prototype.hasOwnProperty.call(settings, 'adminPassword')) {
      this.data.adminPassword = settings.adminPassword;
    }
    if (Object.prototype.hasOwnProperty.call(settings, 'entryFee')) {
      this.data.entryFee = settings.entryFee;
    }
    if (Object.prototype.hasOwnProperty.call(settings, 'submissionsLocked')) {
      this.data.submissionsLocked = !!settings.submissionsLocked;
    }
    this.saveData();
  }

  // אימות מנהל
  authenticateAdmin(password) {
    return password === this.data.adminPassword;
  }

  // יצירת 16 משחקים ברירת מחדל
  createDefaultMatches(week = null) {
    const targetWeek = week || this.data.currentWeek;
    const existingMatches = this.getMatches(targetWeek);

    if (existingMatches.length >= 16) {
      existingMatches.forEach((match, index) => {
        if (!match.name) {
          match.name = `Match ${index + 1}`;
          match.homeTeam = match.homeTeam || `Home Team ${index + 1}`;
          match.awayTeam = match.awayTeam || `Away Team ${index + 1}`;
          this.updateMatch(match.id, match);
        }
      });
      const updatedMatches = this.getMatches(targetWeek);
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

    newMatches.forEach(match => this.addMatch(match));
    const updatedMatches = this.getMatches(targetWeek);
    return updatedMatches;
  }

  // קבלת דירוג
  getLeaderboard(week = null) {
    const guesses = this.calculateScores(week);
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
