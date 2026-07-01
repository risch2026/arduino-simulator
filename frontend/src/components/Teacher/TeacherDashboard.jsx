import { useState } from 'react';
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
