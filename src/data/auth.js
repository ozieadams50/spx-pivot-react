const KEY = 'auth_session';

const DEFAULTS = {
  loggedIn:      false,
  userId:        null,
  role:          'subscriber',
  subscriptions: [],
};

export function loadAuth() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveAuth(partial) {
  const current = loadAuth();
  localStorage.setItem(KEY, JSON.stringify({ ...current, ...partial }));
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}

// The JWT's own "role" claim, set once at login and never touched by the
// role-switcher (setRole() only overwrites auth.role, never auth.token) — the
// one place in local storage a "view as" simulation can't corrupt. Used to
// gate whether the switcher itself should even be offered, so simulating a
// lower role can never strand a real Admin/Super User without a way back.
// Not a security boundary (no signature check — that's the server's job on
// every protected call), just the source of truth for this display gate.
export function decodeJwtRole(token) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json).role ?? null;
  } catch {
    return null;
  }
}

const REMEMBERED_EMAIL_KEY = 'remembered_email';

export function loadRememberedEmail() {
  try {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveRememberedEmail(email) {
  localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
}

export function clearRememberedEmail() {
  localStorage.removeItem(REMEMBERED_EMAIL_KEY);
}
