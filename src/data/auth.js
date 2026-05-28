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
