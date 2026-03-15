import { useState, useEffect } from 'react';

export function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = sessionStorage.getItem(key);
      return stored ? JSON.parse(stored) : (typeof initialValue === 'function' ? initialValue() : initialValue);
    } catch { return typeof initialValue === 'function' ? initialValue() : initialValue; }
  });
  useEffect(() => {
    try { sessionStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [key, state]);
  return [state, setState];
}

export function seedPersistentState(data) {
  try {
    Object.entries(data).forEach(([key, value]) => {
      sessionStorage.setItem(key, JSON.stringify(value));
    });
  } catch {}
}