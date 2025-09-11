// מערכת ניהול נתונים עם localStorage
class DataManager {
  constructor() {
    this.storageKey = 'toto-shlush-data';
    this.data = this.loadData();
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
    const targetWeek = week || this.data.currentWeek;
    return this.data.matches.filter(match => match.week === targetWeek);
  }

  addMatch(match) {
    const newMatch = {
      id: Date.now().toString(),
      week: match.week || this.data.currentWeek,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      date: match.date || new Date().toISOString(),
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
    const targetWeek = week || this.data.currentWeek;
    return this.data.userGuesses.filter(guess => guess.week === targetWeek);
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

  // חישוב ניקוד
  calculateScores(week = null) {
    const targetWeek = week || this.data.currentWeek;
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
    const targetWeek = week || this.data.currentWeek;
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
    
    if (existingMatches.length >= 16) return existingMatches;

    const newMatches = [];
    for (let i = existingMatches.length + 1; i <= 16; i++) {
      newMatches.push({
        week: targetWeek,
        homeTeam: `קבוצת בית ${i}`,
        awayTeam: `קבוצת חוץ ${i}`,
        result: '',
        category: 'טוטו 16'
      });
    }

    newMatches.forEach(match => this.addMatch(match));
    return this.getMatches(targetWeek);
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
