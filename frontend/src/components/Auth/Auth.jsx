
import { useState } from 'react';
import { useAuth } from '../../store/auth';
import api from '../../api';

export default function Auth() {
  const { login } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', role: 'student' });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'register') {
        await api.post('/register', form);
        const res = await api.post('/login', { username: form.username, password: form.password });
        login(res.user, res.token);
      } else {
        const res = await api.post('/login', { username: form.username, password: form.password });
        login(res.user, res.token);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка подключения к серверу');
    }
  };

  const btnClass = (active) => 'flex-1 py-2 rounded ' + (active ? 'bg-blue-600' : 'bg-slate-700');

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-lg shadow-xl w-96">
        <h1 className="text-2xl font-bold text-center mb-6">Arduino Simulator</h1>
        <div className="flex gap-2 mb-4">
          <button type="button" onClick={() => setMode('login')} className={btnClass(mode==='login')}>Вход</button>
          <button type="button" onClick={() => setMode('register')} className={btnClass(mode==='register')}>Регистрация</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input placeholder="Логин" value={form.username}
            onChange={e => setForm({...form, username: e.target.value})}
            className="w-full p-2 bg-slate-700 rounded" required/>
          <input type="password" placeholder="Пароль" value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            className="w-full p-2 bg-slate-700 rounded" required/>
          {mode === 'register' && (
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
              className="w-full p-2 bg-slate-700 rounded">
              <option value="student">Ученик</option>
              <option value="teacher">Учитель</option>
            </select>
          )}
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button type="submit" className="w-full bg-green-600 hover:bg-green-500 p-2 rounded font-bold">
            {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>
      </div>
    </div>
  );
}
