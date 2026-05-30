const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

function getToken() {
  try {
    return JSON.parse(localStorage.getItem('auth_session') ?? '{}').token ?? null;
  } catch {
    return null;
  }
}

function forceLogout() {
  localStorage.removeItem('auth_session');
  window.location.href = '/login';
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401 && path !== '/auth/login') {
    forceLogout();
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Request failed');
  }

  return res.json();
}
