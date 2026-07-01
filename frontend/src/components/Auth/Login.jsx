import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth';

export default function Login() {
  const [mode, setMode] = useState('student');
  const [name, setName] = useState('');
  const [classroom, setClassroom] = useState('class-1');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!name.trim()) {
      alert('Введите имя');
      return;
    }
    
    // Для учителя — простая проверка пароля (демо)
    if (mode === 'teacher' && password !== 'teacher123') {
      alert('Неверный пароль учителя (подсказка: teacher123)');
      return;
    }

    login({
      name: name.trim(),
      role: mode,
      classroomId: classroom,
      studentId: mode === 'student' ? 'student-' + Date.now() : 'teacher-1',
      teacherId: mode === 'teacher' ? 'teacher-1' : null
    });

    navigate(mode === 'teacher' ? '/teacher' : '/');
  };

  return (
    <div className="h-full flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 p-8 rounded-lg shadow-xl w-96 border border-slate-700">
        <h1 className="text-2xl font-bold text-center mb-6">🔑 Вход в систему</h1>
        
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('student')}
            className={`flex-1 py-2 rounded transition-colors ${
              mode === 'student' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            👨‍ Ученик
          </button>
          <button
            onClick={() => setMode('teacher')}
            className={`flex-1 py-2 rounded transition-colors ${
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder={mode === 'student' ? 'Иван Иванов' : 'Мария Петровна'}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:border-blue-500 focus:outline-none"
          />
        </div>

        {mode === 'student' && (
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1">Класс</label>
            <select
              value={classroom}
              onChange={(e) => setClassroom(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="class-1">Класс 1</option>
              <option value="class-2">Класс 2</option>
              <option value="class-3">Класс 3</option>
            </select>
          </div>
        )}

        {mode === 'teacher' && (
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1">Пароль учителя</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="teacher123"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        )}

        <button
          onClick={handleLogin}
          className="w-full py-2 bg-green-600 hover:bg-green-500 rounded font-medium transition-colors"
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
