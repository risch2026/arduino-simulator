import { useState } from 'react';
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
