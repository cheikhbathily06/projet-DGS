import { createContext, useContext, useState, useEffect } from 'react';
import apiFetch from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('dgs_token');
    if (!token) {
      setLoading(false);
      return;
    }

    apiFetch('/auth/me')
      .then((data) => setUser(data))
      .catch(() => {
        localStorage.removeItem('dgs_token');
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem('dgs_token', data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    localStorage.setItem('dgs_token', data.token);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore les erreurs réseau au logout
    }
    localStorage.removeItem('dgs_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}