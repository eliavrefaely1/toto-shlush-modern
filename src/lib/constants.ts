import { CONSTANTS } from '../types';

// API Endpoints
export const API_ENDPOINTS = {
  DATA: '/api/data',
  LEADERBOARD: '/api/leaderboard',
  POT: '/api/pot',
  BACKUP: '/api/backup',
  HEALTH: '/api/health',
  SEND_EMAIL: '/api/send-email'
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'שגיאת רשת - אנא נסה שוב',
  VALIDATION_ERROR: 'שגיאת אימות - אנא בדוק את הנתונים',
  UNAUTHORIZED: 'אין הרשאה לבצע פעולה זו',
  NOT_FOUND: 'המשאב המבוקש לא נמצא',
  SERVER_ERROR: 'שגיאת שרת - אנא נסה שוב מאוחר יותר',
  INVALID_PASSWORD: 'סיסמה שגויה',
  USER_EXISTS: 'המשתמש כבר קיים במערכת',
  USER_NOT_FOUND: 'המשתמש לא נמצא',
  MATCH_NOT_FOUND: 'המשחק לא נמצא',
  GUESS_NOT_FOUND: 'הניחוש לא נמצא',
  SUBMISSIONS_LOCKED: 'הגשת ניחושים נעולה',
  INVALID_GUESS: 'ניחוש לא תקין',
  BACKUP_FAILED: 'יצירת גיבוי נכשלה',
  RESTORE_FAILED: 'שחזור גיבוי נכשל'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  USER_CREATED: 'המשתמש נוצר בהצלחה',
  USER_UPDATED: 'המשתמש עודכן בהצלחה',
  USER_DELETED: 'המשתמש נמחק בהצלחה',
  MATCH_CREATED: 'המשחק נוצר בהצלחה',
  MATCH_UPDATED: 'המשחק עודכן בהצלחה',
  MATCH_DELETED: 'המשחק נמחק בהצלחה',
  GUESS_SUBMITTED: 'הניחוש נשלח בהצלחה',
  GUESS_UPDATED: 'הניחוש עודכן בהצלחה',
  GUESS_DELETED: 'הניחוש נמחק בהצלחה',
  SETTINGS_UPDATED: 'ההגדרות עודכנו בהצלחה',
  BACKUP_CREATED: 'הגיבוי נוצר בהצלחה',
  BACKUP_RESTORED: 'הגיבוי שוחזר בהצלחה',
  DATA_REFRESHED: 'הנתונים רוענו בהצלחה'
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[א-ת0-9\s]+$/
  },
  PHONE: {
    PATTERN: /^[0-9\-\+\(\)\s]+$/,
    MIN_LENGTH: 9,
    MAX_LENGTH: 15
  },
  PASSWORD: {
    MIN_LENGTH: 4,
    MAX_LENGTH: 20
  },
  GUESS: {
    VALID_VALUES: ['1', 'X', '2', ''],
    REQUIRED_COUNT: CONSTANTS.MAX_GUESSES
  }
} as const;

// UI Constants
export const UI_CONSTANTS = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  TOAST_DURATION: 3000,
  REFRESH_INTERVAL: 30000,
  COUNTDOWN_INTERVAL: 1000
} as const;

// Default Values
export const DEFAULT_VALUES = {
  SETTINGS: {
    adminPassword: CONSTANTS.DEFAULT_ADMIN_PASSWORD,
    entryFee: CONSTANTS.DEFAULT_ENTRY_FEE,
    totoFirstPrize: CONSTANTS.DEFAULT_TOTO_PRIZE,
    submissionsLocked: false,
    countdownActive: false,
    countdownTarget: '',
    currentWeek: 1
  },
  USER: {
    paymentStatus: 'unpaid' as const,
    isAdmin: false
  },
  MATCH: {
    category: CONSTANTS.MATCH_CATEGORIES.TOTO_16,
    result: ''
  },
  GUESS: {
    guesses: Array(CONSTANTS.MAX_GUESSES).fill(''),
    score: 0,
    correct: Array(CONSTANTS.MAX_GUESSES).fill(false),
    paymentStatus: 'unpaid' as const,
    week: 1
  }
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'toto_user_preferences',
  ADMIN_TOKEN: 'toto_admin_token',
  LAST_BACKUP: 'toto_last_backup'
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;
