import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Simulator from './components/Simulator/Simulator';
import TeacherDashboard from './components/Teacher/TeacherDashboard';
import Materials from './components/Materials/Materials';
import Projects from './components/Projects/Projects';
import Login from './components/Auth/Login';

function NavBar() {
  const { user, logout, isTeacher } = useAuth();
  const location = useLocation();
  
  const links = [
    { to: '/', label: '🔧 Симулятор' },
    { to: '/materials', label: '📚 Материалы' },
    { to: '/projects', label: '📁 Проекты' },
  ];
  
  if (isTeacher) {
    links.push({ to: '/teacher', label: '👨‍ Панель учителя' });
  }

  return (
    <nav className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center gap-1">
      <span className="text-white font-bold mr-4">Arduino Lab</span>
      {links.map(link => (
        <Link
          key={link.to}
          to={link.to}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${
            location.pathname === link.to
              ? 'bg-blue-600 text-white'
              : 'text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          {link.label}
        </Link>
      ))}
      <div className="ml-auto flex items-center gap-3">
        {user && (
          <span className="text-sm text-slate-300">
            {user.role === 'teacher' ? '‍🏫' : '👨‍🎓'} {user.name}
          </span>
        )}
        {user ? (
          <button
            onClick={logout}
            className="px-3 py-1.5 bg-red-700 hover:bg-red-600 rounded text-sm"
          >
            Выйти
          </button>
        ) : (
          <Link
            to="/login"
            className="px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded text-sm"
          >
            🔑 Вход
          </Link>
        )}
      </div>
    </nav>
  );
}

// Защита роута: требует авторизации
function ProtectedRoute({ children, requireTeacher = false }) {
  const { user, isTeacher } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (requireTeacher && !isTeacher) return <Navigate to="/" replace />;
  return children;
}

function AppContent() {
  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white">
      <NavBar />
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Simulator /></ProtectedRoute>} />
          <Route path="/teacher" element={
            <ProtectedRoute requireTeacher={true}>
              <TeacherDashboard />
            </ProtectedRoute>
          } />
          <Route path="/materials" element={<ProtectedRoute><Materials /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
