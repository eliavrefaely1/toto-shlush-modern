// Core Types
export interface User {
  id: string;
  name: string;
  phone?: string;
  isAdmin?: boolean;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date?: string;
  time?: string;
  result?: string;
  category: string;
  league?: string;
  day?: string;
  week?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserGuess {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  guesses: string[];
  score: number;
  correct: boolean[];
  paymentStatus: PaymentStatus;
  week: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  score: number;
  paymentStatus: PaymentStatus;
  user: User;
}

export interface Pot {
  numOfPlayers: number;
  amountPerPlayer: number;
  totalAmount: number;
}

export interface Settings {
  adminPassword: string;
  entryFee: number;
  totoFirstPrize: number;
  submissionsLocked: boolean;
  countdownActive: boolean;
  countdownTarget: string;
  adminEmail?: string;
  currentWeek: number;
}

export interface Countdown {
  active: boolean;
  target: string;
  d: number;
  h: number;
  m: number;
  s: number;
}

export interface MatchesByDay {
  [dayName: string]: Match[];
}

// Enums
export enum PaymentStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  PENDING = 'pending'
}

export enum MatchResult {
  HOME_WIN = '1',
  DRAW = 'X',
  AWAY_WIN = '2'
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

// API Response Types
export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DataStatus {
  mainTable: {
    size: number;
    users: number;
    matches: number;
    guesses: number;
  };
  splitTables: {
    meta: number;
    users: number;
  };
  issues: string[];
}

// Component Props Types
export interface HomeData {
  pot: Pot;
  leaderboard: LeaderboardEntry[];
  matches: Match[];
  isRefreshing: boolean;
  countdown: Countdown;
  settings: Settings;
  topScore: number | null;
  matchesByDay: MatchesByDay;
  refreshData: () => Promise<void>;
}

// Form Types
export interface PersonalDetailsFormData {
  name: string;
  phone: string;
}

export interface GuessFormData {
  guesses: string[];
}

// Admin Types
export interface AdminData {
  users: User[];
  matches: Match[];
  guesses: UserGuess[];
  settings: Settings;
  pot: Pot;
  leaderboard: LeaderboardEntry[];
}

// Backup Types
export interface BackupData {
  timestamp: string;
  data: {
    users: User[];
    matches: Match[];
    userGuesses: UserGuess[];
    settings: Settings;
  };
  metadata: {
    version: string;
    totalSize: number;
    userCount: number;
    matchCount: number;
    guessCount: number;
  };
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Constants
export const CONSTANTS = {
  MAX_GUESSES: 16,
  DEFAULT_ENTRY_FEE: 35,
  DEFAULT_TOTO_PRIZE: 8000000,
  DEFAULT_ADMIN_PASSWORD: '1234',
  DAY_NAMES: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
  MATCH_CATEGORIES: {
    TOTO_16: 'טוטו 16',
    TOTO_13: 'טוטו 13'
  }
} as const;

// KV Keys
export const KV_KEYS = {
  MAIN_DATA: 'toto:data:v1',
  META: 'toto:meta:v1',
  USERS: 'toto:users:v1',
  MATCHES: (week: number) => `toto:week:${week}:matches:v1`,
  GUESSES: (week: number) => `toto:week:${week}:guesses:v1`
} as const;
