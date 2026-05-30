import { createContext, useContext, useEffect, useState } from 'react';
import { loadAuth, saveAuth, clearAuth } from '../data/auth';
import { DEFAULT_MATRIX, loadMatrix, saveMatrix } from '../data/accessMatrix';
import { apiFetch } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth,          setAuth]         = useState(loadAuth);
  const [accessMatrix,  setAccessMatrix] = useState(loadMatrix);

  // Sync access matrix from server whenever the user is logged in.
  // localStorage is used as the initial/cached state (instant render),
  // then the server version updates within ~1 second.
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
      .catch(() => {}); // keep cached matrix on network failure
  }, [auth.loggedIn]);

  function login({ userId, role, subscriptions, token, user }) {
    const session = { loggedIn: true, userId, role, subscriptions, token: token ?? null, user: user ?? null };
    saveAuth(session);
    setAuth((a) => ({ ...a, ...session }));
  }

  function logout() {
    clearAuth();
    setAuth({ loggedIn: false, userId: null, role: 'subscriber', subscriptions: [], token: null, user: null });
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
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
