import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) api.setToken(token);
  }, []);

  const login = async (email, password) => {
    const result = await api.login({ email, password });
    api.setToken(result.token);
    setUser(result.user);
    localStorage.setItem('user', JSON.stringify(result.user));
    return result;
  };

  const register = async (data) => {
    const result = await api.register(data);
    return result;
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
    localStorage.removeItem('user');
  };

  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isTeacher, isStudent }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}