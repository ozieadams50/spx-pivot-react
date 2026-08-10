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
