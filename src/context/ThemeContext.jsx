import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'spx_theme';

function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'dark';
  } catch {
    return 'dark';
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const stored = getStoredTheme();
    applyTheme(stored);
    return stored;
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    apiFetch('/profile', {
      method: 'PUT',
      body: JSON.stringify({ theme: newTheme }),
    }).catch(() => {});
  }, []);

  const loadFromProfile = useCallback((profileTheme) => {
    if (profileTheme && profileTheme !== theme) {
      setThemeState(profileTheme);
      localStorage.setItem(STORAGE_KEY, profileTheme);
      applyTheme(profileTheme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, loadFromProfile }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
