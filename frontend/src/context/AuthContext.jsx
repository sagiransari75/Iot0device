'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const BACKEND = typeof window !== 'undefined' ? `http://${window.location.hostname}:4000` : 'http://localhost:4000';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('iot_token');
    if (!token) { setLoading(false); return; }
    fetch(`${BACKEND}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(u => { if (u) setUser(u); else localStorage.removeItem('iot_token'); })
      .catch(() => localStorage.removeItem('iot_token'))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const r = await fetch(`${BACKEND}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Login failed');
    localStorage.setItem('iot_token', d.token);
    setUser(d.user);
    return d.user;
  }

  async function signup(name, email, password) {
    const r = await fetch(`${BACKEND}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Signup failed');
    localStorage.setItem('iot_token', d.token);
    setUser(d.user);
    return d.user;
  }

  async function logout() {
    const token = localStorage.getItem('iot_token');
    if (token) {
      fetch(`${BACKEND}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem('iot_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
