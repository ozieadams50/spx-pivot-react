import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { loadAuth, saveAuth, clearAuth, decodeJwtRole } from '../data/auth';
import { DEFAULT_MATRIX, loadMatrix, saveMatrix } from '../data/accessMatrix';
import { apiFetch } from '../lib/api';

const AuthContext = createContext(null);

const TIMEOUT_MS  = 60 * 60 * 1000;        // 1 hour
const WARN_MS     = 5 * 60 * 1000;         // warn 5 min before logout
const CHECK_EVERY = 30 * 1000;             // check every 30 seconds

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

// Privilege order for the "view as" switcher. A session may only ever view the
// app at or BELOW its real (server-verified) role — never above it. Unknown /
// custom role keys rank as subscriber.
export const ROLE_RANK = { subscriber: 0, admin: 1, superuser: 2 };
const rank = (r) => ROLE_RANK[r] ?? 0;

export function AuthProvider({ children }) {
  const [auth,           setAuth]         = useState(loadAuth);
  const [accessMatrix,   setAccessMatrix] = useState(loadMatrix);
  const [sessionWarning, setWarning]      = useState(false);  // true → show 5-min banner
  // Real role as reported by the server (GET /profile reads user_profile.user_role).
  // Never taken from localStorage, which the user can edit freely.
  const [serverRole,     setServerRole]   = useState(null);
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

  // ── Server-verified role ──────────────────────────────────────────────────
  // Re-checked on every app load so a role edited in localStorage (or a stale
  // "view as" left over from a different account) can't survive a refresh.
  useEffect(() => {
    if (!auth.loggedIn) { setServerRole(null); return; }
    apiFetch('/profile')
      .then((u) => setServerRole(u?.role ?? 'subscriber'))
      .catch(() => setServerRole('subscriber'));
  }, [auth.loggedIn, auth.token]);

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
    setServerRole(role ?? 'subscriber');
  }

  function logout() {
    clearAuth();
    window.location.href = '/login';
  }

  // "View as" — only allowed at or below the real role. Anything higher is ignored.
  function setRole(role) {
    if (rank(role) > rank(realRole)) return;
    saveAuth({ role });
    setAuth((a) => ({ ...a, role }));
  }

  function updateMatrix(matrix) {
    saveMatrix(matrix);
    setAccessMatrix(matrix);
  }

  // The account's real role. Server answer first; until it arrives, the JWT's
  // role claim; failing both, subscriber. NEVER falls back to auth.role — that
  // is the simulatable, user-editable value (before 2026-10-07 it did, so a
  // missing/garbled token let a localStorage edit pass as the real role).
  const realRole = serverRole ?? decodeJwtRole(auth.token) ?? 'subscriber';

  // Effective role used by every canAccess() check: the simulated role, but
  // clamped so it can never exceed the real one.
  const role = rank(auth.role) > rank(realRole) ? realRole : (auth.role ?? realRole);

  useEffect(() => {
    if (auth.loggedIn && role !== auth.role) {
      saveAuth({ role });
      setAuth((a) => ({ ...a, role }));
    }
  }, [auth.loggedIn, auth.role, role]);

  return (
    <AuthContext.Provider value={{ ...auth, role, realRole, login, logout, setRole, accessMatrix, updateMatrix }}>
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
