// מערכת ניהול נתונים עם localStorage
class DataManager {
  constructor() {
    this.storageKey = 'toto-shlush-data';
    this.data = this.loadData();
    this.normalizeData();
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
      // Push to server so all devices see the same data
      // Fire-and-forget; merge with server to avoid overwriting
      // No await to keep UI responsive
      this.mergeAndSave?.();
    } catch (error) {
      // suppressed console output
    }
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
      deletedGuessKeys: []
    };
  }

  // סנכרון מהשרת (KV) ללקוח
  async syncFromServer() {
    // מושך מהשרת, מאחד מול מקומי, ושומר מקומי; לא מוחק נתונים אם השרת ריק
    try {
      const res = await fetch('/api/data', { cache: 'no-store' })
      if (!res.ok) return
      const serverData = await res.json()
      if (serverData && typeof serverData === 'object') {
        // מיזוג דו-כיווני: שרת מול מקומי
        const merged = this._mergeData(serverData || this.getDefaultData(), this.data || this.getDefaultData())
        this.data = merged
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.storageKey, JSON.stringify(this.data))
        }
      }
    } catch (_) {
      // offline/אין API — השאר את הנתונים המקומיים
    }
  }

  // מיזוג נתונים מקומי עם נתוני השרת ושמירה ל‑KV
  async mergeAndSave() {
    try {
      const res = await fetch('/api/data', { cache: 'no-store' })
      const serverData = res.ok ? await res.json() : null
      const merged = this._mergeData(serverData || this.getDefaultData(), this.data)
      this.data = merged
      // שמור מקומית לפני ניסיון שרת
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(merged))
      }
      await fetch('/api/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged)
      })
    } catch (_) {
      // offline/אין KV — יתעדכן בפעם הבאה
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

      // מפות לפי מזהה
      const byId = new Map(srvList.map(m => [m.id, m]))
      // עדכן/הוסף פריטים מקומיים
      locList.forEach(m => {
        if (m && m.id) {
          const prev = byId.get(m.id)
          // מקומי גובר (כולל תוצאות שהתעדכנו)
          byId.set(m.id, prev ? { ...prev, ...m } : m)
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

    // משתמשים — מאחדים לפי name (מפתח יציב יותר מ-id כעת)
    const byPhone = new Map()
    ;[...(server.users || []), ...(local.users || [])].forEach(u => {
      if (!u) return
      const key = (u.name || '').toLowerCase().trim()
      const exist = byPhone.get(key)
      if (!exist) byPhone.set(key, u)
    })
    merged.users = Array.from(byPhone.values())

    // ניחושים — איחוד לפי (name, week) תוך כיבוד מחיקות
    const gKey = g => `${(g.name||'').toLowerCase().trim()}__${g.week}`
    const deletedGuessKeys = new Set((local.deletedGuessKeys || []).map(k => String(k).toLowerCase()))
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

    // איפוס דגלי מחיקה לאחר שמירה
    merged.deletedWeeks = []
    merged.deletedGuessKeys = []
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
      ...match
    };
    this.data.matches.push(newMatch);
    this.saveData();
    return newMatch;
  }

  updateMatch(matchId, updates) {
    const matchIndex = this.data.matches.findIndex(m => m.id === matchId);
    if (matchIndex !== -1) {
      this.data.matches[matchIndex] = { ...this.data.matches[matchIndex], ...updates };
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
