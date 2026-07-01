import { useState } from 'react';
import { useAuth } from '../../store/auth';

export default function Auth() {
  const [mode, setMode] = useState('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleLogin = () => {
    if (!username.trim()) {
      alert('Введите имя');
      return;
    }

    if (mode === 'teacher' && password !== 'teacher123') {
      alert('Неверный пароль учителя (подсказка: teacher123)');
      return;
    }

    login({
      username: username.trim(),
      role: mode,
      classroomId: 'class-1'
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 p-8 rounded-lg shadow-xl w-96 border border-slate-700">
        <h1 className="text-2xl font-bold text-center mb-6">🔑 Вход в систему</h1>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('student')}
            className={`flex-1 py-2 rounded ${
              mode === 'student' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            👨‍🎓 Ученик
          </button>
          <button
            onClick={() => setMode('teacher')}
            className={`flex-1 py-2 rounded ${
              mode === 'teacher' ? 'bg-purple-600' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            👨‍🏫 Учитель
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-1">Имя</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder={mode === 'student' ? 'Иван Иванов' : 'Мария Петровна'}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
          />
        </div>

        {mode === 'teacher' && (
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1">Пароль учителя</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="teacher123"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
            />
          </div>
        )}

        <button
          onClick={handleLogin}
          className="w-full py-2 bg-green-600 hover:bg-green-500 rounded font-medium"
        >
          Войти как {mode === 'student' ? 'ученик' : 'учитель'}
        </button>

        <p className="text-xs text-slate-500 text-center mt-4">
          {mode === 'teacher' ? 'Пароль: teacher123' : 'Демо-режим'}
        </p>
      </div>
    </div>
  );
}
