const KEY = 'manage_users';

const ROLE_KEY_MAP = {
  'Subscriber':  'subscriber',
  'Admin':       'admin',
  'Super User':  'superuser',
};

export const SEED_USERS = [
  {
    id: 1,
    firstName: 'Ozie', lastName: 'Adams', suffix: '',
    email: 'ozie.adams@gmail.com', phone: '',
    tradingStyle: 'Moderate', index: 'SPX', deltaTrigger: 0.35,
    pivotPeriods: ['Weekly'],
    notifEmail: false, notifNtfy: false,
    subscriptionLevel: 'Annual', role: 'Super User',
    password: 'password',
    isActive: true, updatedAt: '2026-05-28T00:00:00',
  },
  {
    id: 2,
    firstName: 'Jane', lastName: 'Smith', suffix: '',
    email: 'jane@example.com', phone: '+15551234567',
    tradingStyle: 'Moderate', index: 'SPX', deltaTrigger: 0.35,
    pivotPeriods: ['Weekly'],
    notifEmail: true, notifNtfy: false,
    subscriptionLevel: 'Monthly', role: 'Subscriber',
    password: 'password',
    isActive: true, updatedAt: '2026-05-15T10:00:00',
  },
  {
    id: 3,
    firstName: 'John', lastName: 'Doe', suffix: 'Jr.',
    email: 'john@example.com', phone: '',
    tradingStyle: 'Aggressive', index: 'XSP', deltaTrigger: 0.25,
    pivotPeriods: ['Daily', 'Weekly'],
    notifEmail: false, notifNtfy: true,
    subscriptionLevel: 'Annual', role: 'Admin',
    password: 'password',
    isActive: true, updatedAt: '2026-05-20T14:30:00',
  },
];

export function loadUsers() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY));
    if (stored?.length) {
      // ensure every stored user has a password field
      let users = stored.map((u) => ({ password: 'password', ...u }));
      // ensure ozie is always present as Super User
      const ozieEmail = 'ozie.adams@gmail.com';
      if (!users.some((u) => u.email.toLowerCase() === ozieEmail)) {
        const maxId = Math.max(...users.map((u) => u.id ?? 0), 0);
        users = [{ ...SEED_USERS[0], id: maxId + 1 }, ...users];
      }
      return users;
    }
    return SEED_USERS;
  } catch {
    return SEED_USERS;
  }
}

export function saveUsers(users) {
  localStorage.setItem(KEY, JSON.stringify(users));
}

export function findUserByEmail(email) {
  return loadUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) ?? null;
}

export function roleKeyForUser(user) {
  return ROLE_KEY_MAP[user?.role] ?? 'subscriber';
}

export function subscriptionsForUser(user) {
  if (!user) return [];
  return user.subscriptionLevel && user.subscriptionLevel !== 'No Access'
    ? ['spx_pivots']
    : [];
}
