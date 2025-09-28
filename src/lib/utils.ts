import { Match, MatchesByDay, User, UserGuess, PaymentStatus } from '../types';
import { VALIDATION_RULES } from './constants';
import { CONSTANTS } from '../types';

// ID Generation
export const generateId = (): string => {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}_${rand}`;
};

export const generateUserIdFromName = (name: string): string => {
  const s = (name || '').toLowerCase().trim();
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0; // 32-bit
  }
  return `u_${Math.abs(h).toString(36)}`;
};

// Validation
export const validateName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || name.trim().length < VALIDATION_RULES.NAME.MIN_LENGTH) {
    return { isValid: false, error: `השם חייב להכיל לפחות ${VALIDATION_RULES.NAME.MIN_LENGTH} תווים` };
  }
  if (name.length > VALIDATION_RULES.NAME.MAX_LENGTH) {
    return { isValid: false, error: `השם חייב להכיל לכל היותר ${VALIDATION_RULES.NAME.MAX_LENGTH} תווים` };
  }
  if (!VALIDATION_RULES.NAME.PATTERN.test(name)) {
    return { isValid: false, error: 'השם חייב להכיל רק אותיות עבריות ורווחים' };
  }
  return { isValid: true };
};

export const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone) return { isValid: true }; // Phone is optional
  
  const cleanPhone = phone.replace(/\s/g, '');
  if (cleanPhone.length < VALIDATION_RULES.PHONE.MIN_LENGTH) {
    return { isValid: false, error: `מספר הטלפון חייב להכיל לפחות ${VALIDATION_RULES.PHONE.MIN_LENGTH} ספרות` };
  }
  if (cleanPhone.length > VALIDATION_RULES.PHONE.MAX_LENGTH) {
    return { isValid: false, error: `מספר הטלפון חייב להכיל לכל היותר ${VALIDATION_RULES.PHONE.MAX_LENGTH} ספרות` };
  }
  if (!VALIDATION_RULES.PHONE.PATTERN.test(phone)) {
    return { isValid: false, error: 'מספר הטלפון מכיל תווים לא תקינים' };
  }
  return { isValid: true };
};

export const validateGuess = (guess: string): { isValid: boolean; error?: string } => {
  if (guess === '') return { isValid: true }; // Empty guess is valid
  
  if (!VALIDATION_RULES.GUESS.VALID_VALUES.includes(guess as any)) {
    return { isValid: false, error: 'ניחוש לא תקין - השתמש ב-1, X או 2' };
  }
  return { isValid: true };
};

export const validateGuesses = (guesses: string[]): { isValid: boolean; error?: string } => {
  if (!Array.isArray(guesses) || guesses.length !== VALIDATION_RULES.GUESS.REQUIRED_COUNT) {
    return { isValid: false, error: `חייב להיות בדיוק ${VALIDATION_RULES.GUESS.REQUIRED_COUNT} ניחושים` };
  }
  
  for (let i = 0; i < guesses.length; i++) {
    const validation = validateGuess(guesses[i]);
    if (!validation.isValid) {
      return { isValid: false, error: `ניחוש ${i + 1}: ${validation.error}` };
    }
  }
  
  return { isValid: true };
};

// Date and Time Utilities
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('he-IL');
};

export const formatTime = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
};

export const parseLocalDateTime = (dateTimeString: string): Date | null => {
  try {
    if (!dateTimeString) return null;
    
    if (dateTimeString.includes('T')) {
      const [date, time] = dateTimeString.split('T');
      const [year, month, day] = date.split('-').map(n => parseInt(n, 10));
      const [hours, minutes] = (time || '').slice(0, 5).split(':').map(n => parseInt(n, 10));
      
      if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
        return new Date(year, (month || 1) - 1, day, hours || 0, minutes || 0, 0);
      }
    }
    
    const dt = new Date(dateTimeString);
    return isNaN(dt.getTime()) ? null : dt;
  } catch {
    return null;
  }
};

// Match Utilities
export const getMatchesByDay = (matches: Match[]): MatchesByDay => {
  if (!matches || !Array.isArray(matches) || matches.length === 0) return {};
  
  const matchesByDay: { [dayName: string]: { matches: Match[]; dayIndex: number } } = {};
  
  matches.forEach(match => {
    let dayName = 'לא מוגדר';
    let dayIndex = 999; // ימים לא מוגדרים יופיעו בסוף
    
    if (match.date) {
      try {
        const date = new Date(match.date);
        dayName = CONSTANTS.DAY_NAMES[date.getDay()];
        dayIndex = date.getDay();
      } catch (e) {
        // אם התאריך לא תקין, נשאיר "לא מוגדר"
      }
    }
    
    if (!matchesByDay[dayName]) {
      matchesByDay[dayName] = { matches: [], dayIndex };
    }
    
    matchesByDay[dayName].matches.push(match);
  });
  
  // מיון המשחקים בכל יום לפי תאריך ושעה
  Object.keys(matchesByDay).forEach(day => {
    matchesByDay[day].matches.sort((a, b) => {
      const dateA = a.date || '1900-01-01';
      const dateB = b.date || '1900-01-01';
      const dateCompare = dateA.localeCompare(dateB);
      if (dateCompare !== 0) return dateCompare;
      
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      return timeA.localeCompare(timeB);
    });
  });
  
  // מיון הימים לפי התאריך האמיתי
  const sortedDays = Object.keys(matchesByDay).sort((a, b) => {
    const earliestA = matchesByDay[a].matches[0];
    const earliestB = matchesByDay[b].matches[0];
    
    if (earliestA && earliestB) {
      const dateA = earliestA.date || '1900-01-01';
      const dateB = earliestB.date || '1900-01-01';
      const dateCompare = dateA.localeCompare(dateB);
      if (dateCompare !== 0) return dateCompare;
      
      const timeA = earliestA.time || '00:00';
      const timeB = earliestB.time || '00:00';
      return timeA.localeCompare(timeB);
    }
    
    return matchesByDay[a].dayIndex - matchesByDay[b].dayIndex;
  });
  
  // החזר אובייקט ממוין
  const sortedMatchesByDay: MatchesByDay = {};
  sortedDays.forEach(day => {
    sortedMatchesByDay[day] = matchesByDay[day].matches;
  });
  
  return sortedMatchesByDay;
};

// Score Calculation
export const calculateScore = (guesses: string[], results: string[]): { score: number; correct: boolean[] } => {
  let score = 0;
  const correct: boolean[] = [];
  
  for (let i = 0; i < guesses.length; i++) {
    // אם אין תוצאה עדיין, הניחוש לא נכון (0 נקודות)
    // אם יש תוצאה והניחוש תואם לה - זה נכון (1 נקודה)
    const isCorrect = !!(results[i] && results[i].trim() !== '' && guesses[i] === results[i]);
    correct.push(isCorrect);
    if (isCorrect) {
      score++;
    }
  }
  
  return { score, correct };
};

// Payment Status Utilities
export const getPaymentStatusColor = (status: PaymentStatus): string => {
  switch (status) {
    case 'paid':
      return 'text-green-600 bg-green-100';
    case 'pending':
      return 'text-yellow-600 bg-yellow-100';
    case 'unpaid':
    default:
      return 'text-red-600 bg-red-100';
  }
};

export const getPaymentStatusText = (status: PaymentStatus): string => {
  switch (status) {
    case 'paid':
      return 'שולם';
    case 'pending':
      return 'ממתין';
    case 'unpaid':
    default:
      return 'לא שולם';
  }
};

// Array Utilities
export const removeDuplicates = <T>(array: T[], keyFn: (item: T) => string): T[] => {
  const seen = new Set<string>();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export const sortByScore = (a: { score: number }, b: { score: number }): number => {
  return b.score - a.score;
};

// String Utilities
export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Error Handling
export const createError = (message: string, code?: string): Error => {
  const error = new Error(message);
  if (code) {
    (error as any).code = code;
  }
  return error;
};

// Security Utilities
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .slice(0, 1000); // Limit length
};

export const isNetworkError = (error: any): boolean => {
  return error instanceof TypeError && error.message.includes('fetch');
};

// Rate Limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (key: string, limit: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= limit) {
    return false;
  }
  
  current.count++;
  return true;
};

// Data Validation
export const validateBackupData = (data: any): { isValid: boolean; error?: string } => {
  try {
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'Invalid data structure' };
    }

    // Check required fields
    const requiredFields = ['users', 'matches', 'userGuesses', 'settings'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        return { isValid: false, error: `Missing required field: ${field}` };
      }
    }

    // Validate arrays
    if (!Array.isArray(data.users)) {
      return { isValid: false, error: 'Users must be an array' };
    }
    if (!Array.isArray(data.matches)) {
      return { isValid: false, error: 'Matches must be an array' };
    }
    if (!Array.isArray(data.userGuesses)) {
      return { isValid: false, error: 'User guesses must be an array' };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: `Validation error: ${error}` };
  }
};

// Local Storage Utilities
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const setToStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
};

export const removeFromStorage = (key: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
};

// Debounce
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
