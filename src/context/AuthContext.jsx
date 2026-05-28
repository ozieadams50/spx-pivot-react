import { createContext, useContext, useState } from 'react';
import { loadAuth, saveAuth, clearAuth } from '../data/auth';
import { loadMatrix, saveMatrix } from '../data/accessMatrix';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth,         setAuth]         = useState(loadAuth);
  const [accessMatrix, setAccessMatrix] = useState(loadMatrix);

  function login({ userId, role, subscriptions }) {
    const session = { loggedIn: true, userId, role, subscriptions };
    saveAuth(session);
    setAuth((a) => ({ ...a, ...session }));
  }

  function logout() {
    clearAuth();
    setAuth({ loggedIn: false, userId: null, role: 'subscriber', subscriptions: [] });
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
