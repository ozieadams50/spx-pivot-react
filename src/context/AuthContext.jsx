import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { loadAuth, saveAuth, clearAuth } from '../data/auth';
import { DEFAULT_MATRIX, loadMatrix, saveMatrix } from '../data/accessMatrix';
import { apiFetch } from '../lib/api';

const AuthContext = createContext(null);

const TIMEOUT_MS  = 2 * 60 * 60 * 1000;   // 2 hours
const WARN_MS     = 5 * 60 * 1000;         // warn 5 min before logout
const CHECK_EVERY = 30 * 1000;             // check every 30 seconds

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

export function AuthProvider({ children }) {
  const [auth,           setAuth]         = useState(loadAuth);
  const [accessMatrix,   setAccessMatrix] = useState(loadMatrix);
  const [sessionWarning, setWarning]      = useState(false);  // true → show 5-min banner
  const lastActivity = useRef(Date.now());
  const intervalRef  = useRef(null);

  // ── Activity listener — reset timer on any user interaction ──────────────
  const resetTimer = useCallback(() => {
    lastActivity.current = Date.now();
    setWarning(false);
  }, []);

  // ── Inactivity watchdog ───────────────────────────────────────────────────
  useEffect(() => {
    if (!auth.loggedIn) {
      clearInterval(intervalRef.current);
      setWarning(false);
      return;
    }

    // Attach activity listeners
    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));

    // Start the watchdog interval
    lastActivity.current = Date.now();
    intervalRef.current = setInterval(() => {
      const idle = Date.now() - lastActivity.current;
      if (idle >= TIMEOUT_MS) {
        // Auto-logout
        clearInterval(intervalRef.current);
        ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, resetTimer));
        clearAuth();
        window.location.href = '/login';
      } else if (idle >= TIMEOUT_MS - WARN_MS) {
        setWarning(true);
      } else {
        setWarning(false);
      }
    }, CHECK_EVERY);

    return () => {
      clearInterval(intervalRef.current);
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [auth.loggedIn, resetTimer]);

  // ── Access matrix sync ────────────────────────────────────────────────────
  useEffect(() => {
    if (!auth.loggedIn) return;
    apiFetch('/settings/access-matrix')
      .then(({ matrix }) => {
        if (matrix) {
          const merged = { ...DEFAULT_MATRIX, ...matrix };
          saveMatrix(merged);
          setAccessMatrix(merged);
        }
      })
      .catch(() => {});
  }, [auth.loggedIn]);

  function login({ userId, role, subscriptions, token, user }) {
    const session = { loggedIn: true, userId, role, subscriptions, token: token ?? null, user: user ?? null };
    saveAuth(session);
    setAuth((a) => ({ ...a, ...session }));
  }

  function logout() {
    clearAuth();
    window.location.href = '/login';
  }

  function setRole(role) {
    saveAuth({ role });
    setAuth((a) => ({ ...a, role }));
  }

  function updateMatrix(matrix) {
    saveMatrix(matrix);
    setAccessMatrix(matrix);
  }

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, setRole, accessMatrix, updateMatrix }}>
      {sessionWarning && (
        <div className="fixed bottom-4 left-1/2 z-[9999] -translate-x-1/2 flex items-center gap-3
                        rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-3 shadow-2xl
                        backdrop-blur-sm">
          <span className="text-[var(--c-amber-strong)]">⚠</span>
          <p className="text-sm text-[var(--c-amber)]">
            Your session will expire in <strong>5 minutes</strong> due to inactivity.
          </p>
          <button
            onClick={resetTimer}
            className="ml-2 rounded-lg bg-amber-500/20 px-3 py-1 text-xs font-semibold
                       text-[var(--c-amber)] transition hover:bg-amber-500/30">
            Stay Logged In
          </button>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
