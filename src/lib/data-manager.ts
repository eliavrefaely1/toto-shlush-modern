import { 
  User, 
  Match, 
  UserGuess, 
  Settings, 
  Pot, 
  LeaderboardEntry, 
  PaymentStatus,
  DEFAULT_VALUES,
  CONSTANTS
} from '../types';
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
  private data: {
    users: User[];
    matches: Match[];
    userGuesses: UserGuess[];
    settings: Settings;
  } | null = null;

  // Initialization
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      const response = await apiClient.getData();
      if (response.ok && response.data) {
        this.data = response.data;
        this.normalizeData();
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
          paymentStatus: user.paymentStatus || DEFAULT_VALUES.USER.paymentStatus,
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
          paymentStatus: guess.paymentStatus || DEFAULT_VALUES.GUESS.paymentStatus,
          week: guess.week || DEFAULT_VALUES.GUESS.week,
          createdAt: guess.createdAt || new Date().toISOString(),
          updatedAt: guess.updatedAt || new Date().toISOString()
        }));

      if (this.data.userGuesses.length !== originalLength) {
        changed = true;
      }
    }

    if (changed) {
      this.saveData();
    }
  }

  private async saveData(): Promise<boolean> {
    if (!this.data) return false;
    
    try {
      const response = await apiClient.updateData(this.data);
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
    return this.data?.users || [];
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
      paymentStatus: DEFAULT_VALUES.USER.paymentStatus,
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
    return this.data?.matches || [];
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
    return this.data?.userGuesses || [];
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
      paymentStatus: DEFAULT_VALUES.GUESS.paymentStatus,
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

    for (const guess of this.data.userGuesses) {
      const { score, correct } = calculateScore(guess.guesses, results);
      
      if (guess.score !== score || JSON.stringify(guess.correct) !== JSON.stringify(correct)) {
        await this.updateUserGuess(guess.id, { score, correct });
      }
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
    const amountPerPlayer = this.data.settings.entryFee;
    const totalAmount = numOfPlayers * amountPerPlayer;

    return { numOfPlayers, amountPerPlayer, totalAmount };
  }

  // Settings
  async getSettings(): Promise<Settings> {
    await this.initialize();
    return this.data?.settings || { ...DEFAULT_VALUES.SETTINGS };
  }

  async updateSettings(settings: Partial<Settings>): Promise<boolean> {
    await this.initialize();
    if (!this.data) return false;

    this.data.settings = {
      ...this.data.settings,
      ...settings,
      updatedAt: new Date().toISOString()
    };

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
