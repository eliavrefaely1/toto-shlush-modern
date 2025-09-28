'use client';

import { useAutoRefresh } from '../hooks/useAutoRefresh';

/**
 * Provider component שמטפל ברענון אוטומטי של הנתונים
 * עוטף את כל האפליקציה ומבצע רענון בכל מעבר בין מסכים
 */
const AutoRefreshProvider = ({ children }) => {
  // השתמש ב-hook לרענון אוטומטי
  useAutoRefresh();

  // החזר את הילדים ללא שינוי
  return children;
};

export default AutoRefreshProvider;
