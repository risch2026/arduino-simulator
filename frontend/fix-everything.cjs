const fs = require('fs');
const path = require('path');

// ============================================================
// === 1. App.jsx — ЧИСТАЯ ВЕРСИЯ ===
// ============================================================
const appContent = `import { useState } from 'react';
import Auth from './components/Auth/Auth';
import Lessons from './components/Lessons/Lessons';
import Simulator from './components/Simulator/Simulator';
import Projects from './components/Projects/Projects';
import TeacherDashboard from './components/Teacher/TeacherDashboard';
import { useAuth } from './store/auth';

export default function App() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('lessons');

  if (!user) return <Auth />;

  const btnClass = (active) =>
    'px-3 py-1 rounded transition-colors ' +
    (active ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300');

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800 p-4 flex justify-between items-center shadow-lg flex-wrap gap-2">
        <h1 className="text-xl font-bold">🔧 Arduino Simulator</h1>

        <nav className="flex gap-2 flex-wrap">
          <button onClick={() => setTab('lessons')} className={btnClass(tab === 'lessons')}>
            📚 Учебные материалы
          </button>
          <button onClick={() => setTab('simulator')} className={btnClass(tab === 'simulator')}>
            🔧 Симулятор
          </button>
          <button onClick={() => setTab('projects')} className={btnClass(tab === 'projects')}>
            📁 Мои проекты
          </button>
          {user.role === 'teacher' && (
            <button onClick={() => setTab('dashboard')} className={btnClass(tab === 'dashboard')}>
              👨‍🏫 Класс
            </button>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-sm">
            {user.username}
            <span className="ml-2 px-2 py-0.5 rounded text-xs bg-slate-700">
              {user.role === 'teacher' ? 'Учитель' : 'Ученик'}
            </span>
          </span>
          <button
            onClick={logout}
            className="text-red-400 text-sm hover:text-red-300 px-2 py-1 rounded hover:bg-slate-700"
          >
            Выйти
          </button>
        </div>
      </header>

      <main className="p-4" style={{ height: 'calc(100vh - 80px)' }}>
        {tab === 'lessons' && <Lessons onOpenInSimulator={() => setTab('simulator')} />}
        {tab === 'simulator' && <Simulator />}
        {tab === 'projects' && <Projects onLoad={() => setTab('simulator')} />}
        {tab === 'dashboard' && user.role === 'teacher' && <TeacherDashboard />}
      </main>
    </div>
  );
}
`;

// ============================================================
// === 2. store/auth.jsx — КОНТЕКСТ АВТОРИЗАЦИИ ===
// ============================================================
const authStoreContent = `import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = (userData) => {
    console.log('✅ Вход:', userData);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    console.log('✅ Выход');
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
`;

// ============================================================
// === 3. Auth.jsx — ФОРМА ВХОДА ===
// ============================================================
const authContent = `import { useState } from 'react';
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
            className={\`flex-1 py-2 rounded \${
              mode === 'student' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
            }\`}
          >
            👨‍🎓 Ученик
          </button>
          <button
            onClick={() => setMode('teacher')}
            className={\`flex-1 py-2 rounded \${
              mode === 'teacher' ? 'bg-purple-600' : 'bg-slate-700 hover:bg-slate-600'
            }\`}
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
`;

// ============================================================
// === 4. Lessons.jsx — ЗАГЛУШКА ===
// ============================================================
const lessonsContent = `import { useState } from 'react';

const LESSONS = [
  { id: 1, title: 'Урок 1: Знакомство с Arduino', description: 'Что такое Arduino', content: 'Arduino — это платформа для создания электронных устройств.' },
  { id: 2, title: 'Урок 2: Мигание светодиодом', description: 'Первая программа — Blink', content: 'void setup() {\\n  pinMode(13, OUTPUT);\\n}\\n\\nvoid loop() {\\n  digitalWrite(13, HIGH);\\n  delay(500);\\n  digitalWrite(13, LOW);\\n  delay(500);\\n}' }
];

export default function Lessons({ onOpenInSimulator }) {
  const [selectedLesson, setSelectedLesson] = useState(null);

  return (
    <div className="h-full flex">
      <div className="w-96 border-r border-slate-700 overflow-y-auto">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold"> Учебные материалы</h2>
          <p className="text-sm text-slate-400 mt-1">{LESSONS.length} уроков</p>
        </div>
        {LESSONS.map(lesson => (
          <div
            key={lesson.id}
            className={\`p-4 border-b border-slate-700 cursor-pointer \${
              selectedLesson?.id === lesson.id ? 'bg-blue-900' : 'hover:bg-slate-800'
            }\`}
            onClick={() => setSelectedLesson(lesson)}
          >
            <h3 className="font-medium">{lesson.title}</h3>
            <p className="text-sm text-slate-400 mt-1">{lesson.description}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {selectedLesson ? (
          <div>
            <h1 className="text-2xl font-bold mb-4">{selectedLesson.title}</h1>
            <pre className="bg-black p-4 rounded text-green-400 font-mono text-sm whitespace-pre-wrap">
              {selectedLesson.content}
            </pre>
            <button
              onClick={onOpenInSimulator}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded"
            >
              🔧 Открыть в симуляторе
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-lg">Выберите урок из списка</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
`;

// ============================================================
// === 5. Projects.jsx — ЗАГЛУШКА ===
// ============================================================
const projectsContent = `import { useState } from 'react';

const PROJECTS = [
  { id: 1, title: 'Светофор', description: 'Три светодиода переключаются по очереди', difficulty: 'Легко', code: 'void setup() {\\n  pinMode(11, OUTPUT);\\n  pinMode(12, OUTPUT);\\n  pinMode(13, OUTPUT);\\n}\\n\\nvoid loop() {\\n  digitalWrite(11, HIGH);\\n  delay(1000);\\n  digitalWrite(11, LOW);\\n  digitalWrite(12, HIGH);\\n  delay(1000);\\n  digitalWrite(12, LOW);\\n  digitalWrite(13, HIGH);\\n  delay(1000);\\n  digitalWrite(13, LOW);\\n}', status: 'not-started' }
];

export default function Projects({ onLoad }) {
  const [selectedProject, setSelectedProject] = useState(null);

  return (
    <div className="h-full flex">
      <div className="w-96 border-r border-slate-700 overflow-y-auto">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold">📁 Мои проекты</h2>
        </div>
        {PROJECTS.map(project => (
          <div
            key={project.id}
            className={\`p-4 border-b border-slate-700 cursor-pointer \${
              selectedProject?.id === project.id ? 'bg-blue-900' : 'hover:bg-slate-800'
            }\`}
            onClick={() => setSelectedProject(project)}
          >
            <h3 className="font-medium">{project.title}</h3>
            <p className="text-sm text-slate-400 mt-1">{project.description}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {selectedProject ? (
          <div>
            <h1 className="text-2xl font-bold mb-4">{selectedProject.title}</h1>
            <p className="text-slate-300 mb-4">{selectedProject.description}</p>
            <pre className="bg-black p-4 rounded text-green-400 font-mono text-sm whitespace-pre-wrap">
              {selectedProject.code}
            </pre>
            <button
              onClick={() => onLoad(selectedProject)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded"
            >
              🔧 Открыть в симуляторе
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <div className="text-6xl mb-4">📁</div>
              <p className="text-lg">Выберите проект из списка</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
`;

// ============================================================
// === 6. TeacherDashboard.jsx — ЗАГЛУШКА ===
// ============================================================
const teacherContent = `import { useState } from 'react';
import { useAuth } from '../../store/auth';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [students] = useState([]);

  if (!user || user.role !== 'teacher') {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-xl">Доступ только для учителей</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-slate-900 text-white">
      <div className="w-80 border-r border-slate-700 p-4 overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-xl font-bold">👥 Ученики</h2>
          <p className="text-sm text-slate-400 mt-1">
            Онлайн: {students.length} | Класс: {user.classroomId || 'class-1'}
          </p>
        </div>

        {students.length === 0 && (
          <div className="text-center text-slate-500 py-8">
            <div className="text-4xl mb-2">📭</div>
            <p>Нет подключённых учеников</p>
            <p className="text-xs mt-2">Ожидание подключения...</p>
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center text-slate-500">
        <div className="text-center">
          <div className="text-6xl mb-4">👈</div>
          <p className="text-lg">Выберите ученика из списка</p>
          <p className="text-sm mt-2">для просмотра его работы</p>
        </div>
      </div>
    </div>
  );
}
`;

// ============================================================
// === 7. main.jsx — ОБОРАЧИВАЕМ В AUTH PROVIDER ===
// ============================================================
const mainContent = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './store/auth';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
`;

// ============================================================
// === ЗАПИСЬ ВСЕХ ФАЙЛОВ ===
// ============================================================
const files = [
  ['src/App.jsx', appContent],
  ['src/store/auth.jsx', authStoreContent],
  ['src/components/Auth/Auth.jsx', authContent],
  ['src/components/Lessons/Lessons.jsx', lessonsContent],
  ['src/components/Projects/Projects.jsx', projectsContent],
  ['src/components/Teacher/TeacherDashboard.jsx', teacherContent],
  ['src/main.jsx', mainContent]
];

for (const [filePath, content] of files) {
  const fullPath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('✅', filePath);
}

// Удаляем старые файлы если есть
const oldFiles = [
  path.join(__dirname, 'src', 'store', 'auth.js'),
  path.join(__dirname, 'src', 'components', 'TeacherDashboard.jsx')
];
for (const oldFile of oldFiles) {
  if (fs.existsSync(oldFile)) {
    fs.unlinkSync(oldFile);
    console.log('🗑 Удалён:', oldFile);
  }
}

// ============================================================
// === ПРОВЕРКА ===
// ============================================================
console.log('\n=== Проверка App.jsx ===');

const appFile = fs.readFileSync(path.join(__dirname, 'src', 'App.jsx'), 'utf8');
const checks = [
  ['Нет () = > (сломано)', /\(\)\s+=\s+>/, false],
  ['Нет & & (сломано)', /&\s+&/, false],
  ['Нет пробелов в className= "', /className=\s+"/, false],
  ['Нет пробелов в to= "/ "', /to=\s*"\s+"/, false],
  ['Нет пробелов в </button >', /<\/\s*button\s+>/, false],
  ['Нет пробелов в <nav >', /<nav\s+>/, false],
  ['Правильный импорт TeacherDashboard', /from '\.\/components\/Teacher\/TeacherDashboard'/, true],
  ['Есть useAuth', /useAuth/, true],
  ['Есть Auth', /<Auth \/>/, true],
  ['Есть Simulator', /<Simulator \/>/, true],
  ['Есть TeacherDashboard', /<TeacherDashboard \/>/, true],
  ['Есть проверка роли', /user\.role === 'teacher'/, true]
];

let allOk = true;
for (const [name, regex, shouldBePresent] of checks) {
  const found = regex.test(appFile);
  const expected = shouldBePresent === false ? false : true;
  const ok = found === expected;
  if (!ok) allOk = false;
  console.log(ok ? '✅' : '❌', name);
}

if (allOk) {
  console.log('\n Все проверки пройдены!');
}

console.log('\n📋 Следующие шаги:');
console.log('   1. Перезапустите Vite: Ctrl+C, затем npm run dev');
console.log('   2. Обновите страницу: Ctrl+F5');
console.log('   3. Все вкладки должны работать');