// src/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

/***
 * Custom hook to utilize localStorage API
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  /* This block uses **lazy initialization** to only run once upon mount.
   * Essentially, when useLocalStorage is used in a file, it will hit this useState
   * upon mount. Each time it mounts, it tries to fetch the stored history object and parse it as JSON.
   * 
   * If there is no history, we add a mock session so the user has an example of usage
  **/ 
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : initialValue;
    } catch {
      localStorage.removeItem(key);
      return initialValue;
    }
  });

  /**
   * Each time the key or state updates, we update localStorage here. 
   */
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // optionally log or show UI error
    }
  }, [state]);

  return [state, setState] as const;
}