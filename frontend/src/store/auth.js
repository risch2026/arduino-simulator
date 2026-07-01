import { create } from 'zustand';
export const useAuth = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  login: (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    set({ user: userData });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null });
  }
}));
