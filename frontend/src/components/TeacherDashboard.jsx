import { useState } from 'react';

export default function TeacherDashboard() {
  const [students] = useState([]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Панель учителя</h2>
      
      <div className="bg-slate-800 p-6 rounded mb-4">
        <h3 className="text-lg font-bold mb-2">Статистика</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-700 p-4 rounded">
            <div className="text-3xl font-bold text-green-400">{students.length}</div>
            <div className="text-sm text-slate-400">Учеников онлайн</div>
          </div>
          <div className="bg-slate-700 p-4 rounded">
            <div className="text-3xl font-bold text-blue-400">0</div>
            <div className="text-sm text-slate-400">Всего проектов</div>
          </div>
          <div className="bg-slate-700 p-4 rounded">
            <div className="text-3xl font-bold text-yellow-400">0</div>
            <div className="text-sm text-slate-400">Выполненных задач</div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded">
        <h3 className="text-lg font-bold mb-3">Ученики в сети</h3>
        {students.length === 0 ? (
          <p className="text-slate-400 text-center py-8">
            Нет учеников в сети. Когда ученики откроют симулятор, они появятся здесь.
          </p>
        ) : (
          <div className="space-y-2">
            {students.map(s => (
              <div key={s.id} className="bg-slate-700 p-3 rounded flex justify-between items-center">
                <span>{s.name}</span>
                <span className="text-green-400 text-sm">● онлайн</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}