const KEY = 'app_notifications';

const SEED = [
  {
    id: 1,
    type: 'email',
    title: 'Morning Pivots Published',
    message: 'Weekly pivots: R2=5340  R1=5320  S1=5285  S2=5265. Market sentiment: Neutral to Bullish. Spread levels updated for today\'s session.',
    timestamp: '2026-05-28T09:48:05',
    read: false,
  },
  {
    id: 2,
    type: 'ntfy',
    title: 'SPX Alert — Approaching S1',
    message: 'SPX at 5287.40 — within 5 pts of your Moderate short strike at 5285. Consider managing your position.',
    timestamp: '2026-05-28T10:14:22',
    read: false,
  },
  {
    id: 3,
    type: 'email',
    title: 'Sentiment Updated — Weekly',
    message: 'Weekly market sentiment has been updated to Bullish. New commentary: "Strong breadth and momentum heading into month-end. Favor bull put spreads above S1."',
    timestamp: '2026-05-28T08:02:03',
    read: true,
  },
  {
    id: 4,
    type: 'ntfy',
    title: 'SPX Evening Signal',
    message: 'SPX closed at 5312.45 — above S1, below R1. Signal: Neutral to Bullish. No adjustments needed overnight.',
    timestamp: '2026-05-28T15:46:22',
    read: true,
  },
];

export function loadNotifications() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(stored) ? stored : SEED;
  } catch {
    return SEED;
  }
}

export function saveNotifications(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function markRead(id) {
  const list = loadNotifications().map((n) => n.id === id ? { ...n, read: true } : n);
  saveNotifications(list);
  return list;
}

export function clearOne(id) {
  const list = loadNotifications().filter((n) => n.id !== id);
  saveNotifications(list);
  return list;
}

export function clearAll() {
  saveNotifications([]);
  return [];
}

export function unreadCount(list) {
  return list.filter((n) => !n.read).length;
}
