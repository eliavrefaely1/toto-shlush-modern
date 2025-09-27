import { 
  User, 
  Match, 
  UserGuess, 
  Settings, 
  Pot, 
  LeaderboardEntry, 
  PaymentStatus,
  CONSTANTS
} from '../types';
import { DEFAULT_VALUES } from './constants';
import { apiClient } from './api-client';
import { 
  generateId, 
  generateUserIdFromName, 
  calculateScore,
  validateName,
  validatePhone,
  validateGuesses,
  createError
} from './utils';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from './constants';

class DataManager {
  private isInitialized = false;
  private lastBackupTime: number | null = null;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private data: {
    users: User[];
    matches: Match[];
    userGuesses: UserGuess[];
    settings: Settings;
  } | null = null;

  // Cache Management
  private setCache(key: string, data: any, ttl: number = 30000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private clearCache(): void {
    this.cache.clear();
  }

  // Initialization
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // נסה לטעון נתונים מה-KV הישן קודם
      const legacyData = await this.loadLegacyData();
      if (legacyData) {
        this.data = legacyData;
        this.normalizeData();
        this.setCache('initialized', true, 300000); // 5 minutes
        this.isInitialized = true;
        return;
      }

      // אם אין נתונים ישנים, נסה את ה-API החדש
      const response = await apiClient.getData();
      if (response.ok && response.data) {
        this.data = response.data;
        this.normalizeData();
        this.setCache('initialized', true, 300000); // 5 minutes
      } else {
        this.data = this.getDefaultData();
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize data:', error);
      this.data = this.getDefaultData();
      this.isInitialized = true;
    }
  }

  private getDefaultData() {
    return {
      users: [],
      matches: [],
      userGuesses: [],
      settings: { ...DEFAULT_VALUES.SETTINGS }
    };
  }

  // טעינת נתונים מה-KV הישן דרך API
  private async loadLegacyData(): Promise<any | null> {
    try {
      // בדוק אם אנחנו בצד השרת או הקליינט
      if (typeof window !== 'undefined') {
        // בצד הקליינט, נסה לטעון דרך API עם fallback ל-KV הישן
        try {
          // נסה לטעון דרך API עם KV הישן
          const response = await fetch('/api/data?legacy=true', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (response.ok) {
            const legacyData = await response.json();
            if (legacyData.users && legacyData.users.length > 0) {
              return {
                users: legacyData.users,
                matches: legacyData.matches || [],
                userGuesses: legacyData.userGuesses || [],
                settings: {
                  adminPassword: legacyData.adminPassword || DEFAULT_VALUES.SETTINGS.adminPassword,
                  entryFee: legacyData.entryFee || DEFAULT_VALUES.SETTINGS.entryFee,
                  totoFirstPrize: legacyData.totoFirstPrize || DEFAULT_VALUES.SETTINGS.totoFirstPrize,
                  submissionsLocked: legacyData.submissionsLocked || false,
                  countdownActive: legacyData.countdownActive || false,
                  countdownTarget: legacyData.countdownTarget || '',
                  currentWeek: 1
                }
              };
            }
          }
        } catch (apiError) {
          console.log('API fallback failed, trying direct KV access');
        }
        
        // אם API לא עבד, נחזור null ונשתמש בנתונים ברירת מחדל
        return null;
      }

      // בצד השרת, נסה לטעון ישירות מה-KV
      const { kv } = await import('@vercel/kv');
      
      // מפתחות KV הישנים
      const KEY = 'toto:data:v1';
      const META_KEY = 'toto:meta:v1';
      const USERS_KEY = 'toto:users:v1';
      const MATCHES_KEY = (w) => `toto:week:${w}:matches:v1`;
      const GUESSES_KEY = (w) => `toto:week:${w}:guesses:v1`;

      // טען נתונים
      const [mainData, metaData, usersData, matchesData, guessesData] = await Promise.all([
        kv.get(KEY).catch(() => null),
        kv.get(META_KEY).catch(() => null),
        kv.get(USERS_KEY).catch(() => null),
        kv.get(MATCHES_KEY(1)).catch(() => null),
        kv.get(GUESSES_KEY(1)).catch(() => null)
      ]);

      // בדוק אם יש נתונים
      const hasUsers = Array.isArray(usersData) ? usersData.length > 0 : (Array.isArray(mainData?.users) ? mainData.users.length > 0 : false);
      if (!hasUsers) return null;

      // המר לפורמט החדש
      const users = Array.isArray(usersData) ? usersData : (Array.isArray(mainData?.users) ? mainData.users : []);
      const matches = Array.isArray(matchesData) ? matchesData : (Array.isArray(mainData?.matches) ? mainData.matches : []);
      const userGuesses = Array.isArray(guessesData) ? guessesData : (Array.isArray(mainData?.userGuesses) ? mainData.userGuesses : []);
      
      const settings = metaData || mainData || {};
      
      return {
        users,
        matches,
        userGuesses,
        settings: {
          adminPassword: settings.adminPassword || DEFAULT_VALUES.SETTINGS.adminPassword,
          entryFee: settings.entryFee || DEFAULT_VALUES.SETTINGS.entryFee,
          totoFirstPrize: settings.totoFirstPrize || DEFAULT_VALUES.SETTINGS.totoFirstPrize,
          submissionsLocked: settings.submissionsLocked || false,
          countdownActive: settings.countdownActive || false,
          countdownTarget: settings.countdownTarget || '',
          currentWeek: 1
        }
      };
    } catch (error) {
      console.error('Failed to load legacy data:', error);
      return null;
    }
  }

  private normalizeData(): void {
    if (!this.data) return;

    let changed = false;

    // Normalize users
    if (Array.isArray(this.data.users)) {
      const seen = new Set<string>();
      const originalLength = this.data.users.length;
      
      this.data.users = this.data.users
        .filter(user => {
          if (!user.id || seen.has(user.id)) {
            changed = true;
            return false;
          }
          seen.add(user.id);
          return true;
        })
        .map(user => ({
          ...user,
          paymentStatus: user.paymentStatus || PaymentStatus.UNPAID,
          createdAt: user.createdAt || new Date().toISOString(),
          updatedAt: user.updatedAt || new Date().toISOString()
        }));

      if (this.data.users.length !== originalLength) {
        changed = true;
      }
    }

    // Normalize matches
    if (Array.isArray(this.data.matches)) {
      const seen = new Set<string>();
      const originalLength = this.data.matches.length;
      
      this.data.matches = this.data.matches
        .filter(match => {
          if (!match.id || seen.has(match.id)) {
            changed = true;
            return false;
          }
          seen.add(match.id);
          return true;
        })
        .map(match => ({
          ...match,
          category: match.category || DEFAULT_VALUES.MATCH.category,
          result: match.result || DEFAULT_VALUES.MATCH.result,
          createdAt: match.createdAt || new Date().toISOString(),
          updatedAt: match.updatedAt || new Date().toISOString()
        }));

      if (this.data.matches.length !== originalLength) {
        changed = true;
      }
    }

    // Normalize guesses
    if (Array.isArray(this.data.userGuesses)) {
      const seen = new Set<string>();
      const originalLength = this.data.userGuesses.length;
      
      this.data.userGuesses = this.data.userGuesses
        .filter(guess => {
          if (!guess.id || seen.has(guess.id)) {
            changed = true;
            return false;
          }
          seen.add(guess.id);
          return true;
        })
        .map(guess => ({
          ...guess,
          paymentStatus: guess.paymentStatus || PaymentStatus.UNPAID,
          week: guess.week || DEFAULT_VALUES.GUESS.week,
          createdAt: guess.createdAt || new Date().toISOString(),
          updatedAt: guess.updatedAt || new Date().toISOString()
        }));

      if (this.data.userGuesses.length !== originalLength) {
        changed = true;
      }
    }

    // Normalize settings
    if (!this.data.settings || typeof this.data.settings !== 'object') {
      this.data.settings = { ...DEFAULT_VALUES.SETTINGS };
      changed = true;
    }

    if (changed) {
      this.saveData();
    }
  }

  private async saveData(): Promise<boolean> {
    if (!this.data) return false;
    
    try {
      const response = await apiClient.updateData(this.data);
      if (response.ok) {
        this.clearCache(); // Clear cache after successful save
      }
      return response.ok;
    } catch (error) {
      console.error('Failed to save data:', error);
      return false;
    }
  }

  private async createAutoBackup(triggerAction: string): Promise<void> {
    try {
      const now = Date.now();
      
      // Prevent rate limiting
      if (this.lastBackupTime && (now - this.lastBackupTime) < 2000) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await apiClient.createBackup(triggerAction);
      this.lastBackupTime = now;
    } catch (error) {
      console.error('Auto backup failed:', error);
    }
  }

  // User Management
  async getUsers(): Promise<User[]> {
    await this.initialize();
    
    // Check cache first
    const cached = this.getCache('users');
    if (cached) return cached;
    
    const users = this.data?.users || [];
    this.setCache('users', users, 60000); // Cache for 1 minute
    return users;
  }

  async addUser(userData: { name: string; phone?: string; isAdmin?: boolean }): Promise<User> {
    await this.initialize();
    if (!this.data) throw createError(ERROR_MESSAGES.SERVER_ERROR);

    // Validation
    const nameValidation = validateName(userData.name);
    if (!nameValidation.isValid) {
      throw createError(nameValidation.error || ERROR_MESSAGES.VALIDATION_ERROR);
    }

    if (userData.phone) {
      const phoneValidation = validatePhone(userData.phone);
      if (!phoneValidation.isValid) {
        throw createError(phoneValidation.error || ERROR_MESSAGES.VALIDATION_ERROR);
      }
    }

    // Check if user exists
    const existingUser = this.data.users.find(u => 
      u.name.toLowerCase().trim() === userData.name.toLowerCase().trim()
    );
    if (existingUser) {
      return existingUser;
    }

    const newUser: User = {
      id: generateUserIdFromName(userData.name),
      name: userData.name.trim(),
      phone: userData.phone?.trim(),
      isAdmin: userData.isAdmin || false,
      paymentStatus: PaymentStatus.UNPAID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.users.push(newUser);
    await this.saveData();
    await this.createAutoBackup(`משתמש חדש נרשם: ${userData.name}`);

    return newUser;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    await this.initialize();
    if (!this.data) return null;

    const userIndex = this.data.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;

    this.data.users[userIndex] = {
      ...this.data.users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.saveData();
    return this.data.users[userIndex];
  }

  async deleteUser(userId: string): Promise<boolean> {
    await this.initialize();
    if (!this.data) return false;

    const user = this.data.users.find(u => u.id === userId);
    if (!user) return false;

    // Remove user
    this.data.users = this.data.users.filter(u => u.id !== userId);
    
    // Remove user's guesses
    this.data.userGuesses = this.data.userGuesses.filter(g => g.userId !== userId);

    await this.saveData();
    await this.createAutoBackup(`משתמש נמחק: ${user.name}`);

    return true;
  }

  // Match Management
  async getMatches(): Promise<Match[]> {
    await this.initialize();
    
    // Check cache first
    const cached = this.getCache('matches');
    if (cached) return cached;
    
    const matches = this.data?.matches || [];
    this.setCache('matches', matches, 60000); // Cache for 1 minute
    return matches;
  }

  async addMatch(matchData: {
    homeTeam: string;
    awayTeam: string;
    date?: string;
    time?: string;
    category?: string;
  }): Promise<Match> {
    await this.initialize();
    if (!this.data) throw createError(ERROR_MESSAGES.SERVER_ERROR);

    const newMatch: Match = {
      id: generateId(),
      homeTeam: matchData.homeTeam.trim(),
      awayTeam: matchData.awayTeam.trim(),
      date: matchData.date || '',
      time: matchData.time || '',
      result: DEFAULT_VALUES.MATCH.result,
      category: matchData.category || DEFAULT_VALUES.MATCH.category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.matches.push(newMatch);
    await this.saveData();
    await this.createAutoBackup(`משחק חדש נוסף: ${newMatch.homeTeam} vs ${newMatch.awayTeam}`);

    return newMatch;
  }

  async updateMatch(matchId: string, updates: Partial<Match>): Promise<Match | null> {
    await this.initialize();
    if (!this.data) return null;

    const matchIndex = this.data.matches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return null;

    this.data.matches[matchIndex] = {
      ...this.data.matches[matchIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.saveData();
    return this.data.matches[matchIndex];
  }

  async deleteMatch(matchId: string): Promise<boolean> {
    await this.initialize();
    if (!this.data) return false;

    const match = this.data.matches.find(m => m.id === matchId);
    if (!match) return false;

    this.data.matches = this.data.matches.filter(m => m.id !== matchId);
    await this.saveData();
    await this.createAutoBackup(`משחק נמחק: ${match.homeTeam} vs ${match.awayTeam}`);

    return true;
  }

  // Guess Management
  async getUserGuesses(): Promise<UserGuess[]> {
    await this.initialize();
    
    // Check cache first
    const cached = this.getCache('userGuesses');
    if (cached) return cached;
    
    const guesses = this.data?.userGuesses || [];
    this.setCache('userGuesses', guesses, 60000); // Cache for 1 minute
    return guesses;
  }

  async addUserGuess(guessData: {
    userId: string;
    name: string;
    phone?: string;
    guesses: string[];
    week?: number;
  }): Promise<UserGuess> {
    await this.initialize();
    if (!this.data) throw createError(ERROR_MESSAGES.SERVER_ERROR);

    // Validation
    const guessesValidation = validateGuesses(guessData.guesses);
    if (!guessesValidation.isValid) {
      throw createError(guessesValidation.error || ERROR_MESSAGES.VALIDATION_ERROR);
    }

    // Remove existing guess for this user
    this.data.userGuesses = this.data.userGuesses.filter(g => g.userId !== guessData.userId);

    const newGuess: UserGuess = {
      id: generateId(),
      userId: guessData.userId,
      name: guessData.name.trim(),
      phone: guessData.phone?.trim(),
      guesses: [...guessData.guesses],
      score: 0,
      correct: Array(CONSTANTS.MAX_GUESSES).fill(false),
      paymentStatus: PaymentStatus.UNPAID,
      week: guessData.week || DEFAULT_VALUES.GUESS.week,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.userGuesses.push(newGuess);
    await this.saveData();
    await this.createAutoBackup(`ניחוש חדש: ${guessData.name}`);

    return newGuess;
  }

  async updateUserGuess(guessId: string, updates: Partial<UserGuess>): Promise<UserGuess | null> {
    await this.initialize();
    if (!this.data) return null;

    const guessIndex = this.data.userGuesses.findIndex(g => g.id === guessId);
    if (guessIndex === -1) return null;

    this.data.userGuesses[guessIndex] = {
      ...this.data.userGuesses[guessIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.saveData();
    return this.data.userGuesses[guessIndex];
  }

  async deleteUserGuess(guessId: string): Promise<boolean> {
    await this.initialize();
    if (!this.data) return false;

    const guess = this.data.userGuesses.find(g => g.id === guessId);
    if (!guess) return false;

    this.data.userGuesses = this.data.userGuesses.filter(g => g.id !== guessId);
    await this.saveData();
    await this.createAutoBackup(`ניחוש נמחק: ${guess.name}`);

    return true;
  }

  // Score Calculation
  async calculateScores(): Promise<UserGuess[]> {
    await this.initialize();
    if (!this.data) return [];

    const matches = this.data.matches;
    const results = matches.map(m => m.result || '');
    let hasChanges = false;

    // Update all guesses in memory first
    for (const guess of this.data.userGuesses) {
      const { score, correct } = calculateScore(guess.guesses, results);
      
      if (guess.score !== score || JSON.stringify(guess.correct) !== JSON.stringify(correct)) {
        guess.score = score;
        guess.correct = correct;
        guess.updatedAt = new Date().toISOString();
        hasChanges = true;
      }
    }

    // Save only once if there were changes
    if (hasChanges) {
      await this.saveData();
    }

    return this.data.userGuesses;
  }

  // Leaderboard
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    await this.initialize();
    if (!this.data) return [];

    const guesses = await this.calculateScores();
    const users = this.data.users;
    const userMap = new Map(users.map(u => [u.id, u]));

    return guesses
      .map(guess => {
        const user = userMap.get(guess.userId);
        return {
          id: guess.id,
          userId: guess.userId,
          name: user?.name || guess.name,
          phone: user?.phone || guess.phone,
          score: guess.score,
          paymentStatus: guess.paymentStatus,
          user: user || { 
            id: guess.userId, 
            name: guess.name, 
            phone: guess.phone, 
            paymentStatus: guess.paymentStatus,
            isAdmin: false,
            createdAt: guess.createdAt,
            updatedAt: guess.updatedAt
          }
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  // Pot Calculation
  async getPot(): Promise<Pot> {
    await this.initialize();
    if (!this.data) return { numOfPlayers: 0, amountPerPlayer: 0, totalAmount: 0 };

    const numOfPlayers = this.data.userGuesses.length;
    const amountPerPlayer = this.data.settings?.entryFee || CONSTANTS.DEFAULT_ENTRY_FEE;
    const totalAmount = numOfPlayers * amountPerPlayer;

    return { numOfPlayers, amountPerPlayer, totalAmount };
  }

  // Settings
  async getSettings(): Promise<Settings> {
    await this.initialize();
    
    // Check cache first
    const cached = this.getCache('settings');
    if (cached) return cached;
    
    const settings = this.data?.settings || { ...DEFAULT_VALUES.SETTINGS };
    this.setCache('settings', settings, 300000); // Cache for 5 minutes
    return settings;
  }

  async updateSettings(settings: Partial<Settings>): Promise<boolean> {
    await this.initialize();
    if (!this.data) return false;

    this.data.settings = {
      ...this.data.settings,
      ...settings
    };

    await this.saveData();
    return true;
  }

  // Update Payment Status
  async updateGuessPaymentStatus(guessId: string, paymentStatus: PaymentStatus): Promise<boolean> {
    await this.initialize();
    if (!this.data) return false;

    const guessIndex = this.data.userGuesses.findIndex(guess => guess.id === guessId);
    if (guessIndex === -1) return false;

    this.data.userGuesses[guessIndex].paymentStatus = paymentStatus;
    this.data.userGuesses[guessIndex].updatedAt = new Date().toISOString();

    await this.saveData();
    return true;
  }

  // Admin Authentication
  async authenticateAdmin(password: string): Promise<boolean> {
    const settings = await this.getSettings();
    return password === settings.adminPassword;
  }
}

// Create singleton instance
export const dataManager = new DataManager();
export default dataManager;
