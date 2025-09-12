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

  loadData() {
    if (typeof window === 'undefined') return this.getDefaultData();
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : this.getDefaultData();
    } catch (error) {
      console.error('Error loading data:', error);
      return this.getDefaultData();
    }
  }

  saveData() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (error) {
      console.error('Error saving data:', error);
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
      matches: [],
      users: [],
      userGuesses: [],
      pots: []
    };
  }

  // ניהול משחקים
  getMatches(week = null) {
    const targetWeek = (week ?? this.data.currentWeek);
    const targetNum = Number(targetWeek);
    const matches = this.data.matches.filter(match => Number(match.week) === targetNum);
    console.log(`Fetching matches for week: ${targetNum}`);
    console.log('Matches:', matches);
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
      console.log(`Clearing matches for week: ${w}`);
      this.data.matches = this.data.matches.filter(m => Number(m.week) !== w);
    } else {
      console.log('Clearing all matches');
      this.data.matches = [];
    }
    this.saveData();
    console.log('Matches after clearing:', this.data.matches);
  }

  // ניהול משתמשים
  getUsers() {
    return this.data.users;
  }

  addUser(user) {
    const newUser = {
      id: Date.now().toString(),
      name: user.name,
      phone: user.phone,
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
      phone: guess.phone,
      week: guess.week || this.data.currentWeek,
      guesses: guess.guesses || Array(16).fill(''),
      score: 0,
      createdAt: new Date().toISOString(),
      ...guess
    };

    // מחיקת ניחוש קודם אם קיים
    this.data.userGuesses = this.data.userGuesses.filter(
      g => !(g.userId === newGuess.userId && g.week === newGuess.week)
    );

    this.data.userGuesses.push(newGuess);
    this.saveData();
    return newGuess;
  }

  updateUserGuess(guessId, updates) {
    const guessIndex = this.data.userGuesses.findIndex(g => g.id === guessId);
    if (guessIndex !== -1) {
      this.data.userGuesses[guessIndex] = { ...this.data.userGuesses[guessIndex], ...updates };
      this.saveData();
      return this.data.userGuesses[guessIndex];
    }
    return null;
  }

  // מחיקת ניחושים
  deleteUserGuess(guessId) {
    const before = this.data.userGuesses.length;
    this.data.userGuesses = this.data.userGuesses.filter(g => g.id !== guessId);
    const after = this.data.userGuesses.length;
    if (after !== before) this.saveData();
    return before - after;
  }

  deleteUserGuessesByUserAndWeek(userId, week = null) {
    const targetWeek = (week ?? this.data.currentWeek);
    const w = Number(targetWeek);
    const before = this.data.userGuesses.length;
    this.data.userGuesses = this.data.userGuesses.filter(g => !(g.userId === userId && Number(g.week) === w));
    const after = this.data.userGuesses.length;
    if (after !== before) this.saveData();
    return before - after;
  }

  clearAllGuesses(week = null) {
    const before = this.data.userGuesses.length;
    if (week !== null && week !== undefined) {
      const w = Number(week);
      this.data.userGuesses = this.data.userGuesses.filter(g => Number(g.week) !== w);
    } else {
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
      matches.forEach((match, index) => {
        if (match.result && guess.guesses[index] === match.result) {
          score++;
        }
      });

      if (guess.score !== score) {
        this.updateUserGuess(guess.id, { score });
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
      entryFee: this.data.entryFee
    };
  }

  updateSettings(settings) {
    this.data.currentWeek = settings.currentWeek || this.data.currentWeek;
    this.data.adminPassword = settings.adminPassword || this.data.adminPassword;
    this.data.entryFee = settings.entryFee || this.data.entryFee;
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

    console.log('Existing matches:', existingMatches);

    if (existingMatches.length >= 16) {
      console.log('Updating existing matches with proper names if needed.');
      existingMatches.forEach((match, index) => {
        if (!match.name) {
          match.name = `Match ${index + 1}`;
          match.homeTeam = match.homeTeam || `Home Team ${index + 1}`;
          match.awayTeam = match.awayTeam || `Away Team ${index + 1}`;
          this.updateMatch(match.id, match);
        }
      });
      const updatedMatches = this.getMatches(targetWeek);
      console.log('Updated matches:', updatedMatches);
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
      console.log('Creating match:', match);
      newMatches.push(match);
    }

    newMatches.forEach(match => this.addMatch(match));
    const updatedMatches = this.getMatches(targetWeek);
    console.log('Updated matches:', updatedMatches);
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
