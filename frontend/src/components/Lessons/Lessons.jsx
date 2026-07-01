import { useEffect, useState } from 'react';
import { useAuth } from '../../store/auth';
import api from '../../api';

export default function Lessons({ onOpenInSimulator }) {
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [editing, setEditing] = useState(null);
  const isTeacher = user.role === 'teacher';

  const load = async () => {
    try { setLessons(await api.get('/lessons')); } catch { setLessons([]); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing.title) return alert('Введите заголовок');
    if (editing.id) await api.put('/lessons/' + editing.id, editing);
    else await api.post('/lessons', editing);
    setEditing(null);
    load();
  };

  const remove = async (id) => {
    if (confirm('Удалить урок?')) { await api.delete('/lessons/' + id); load(); }
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2 space-y-3">
        <h2 className="text-2xl font-bold">Учебные материалы и задачник</h2>
        {lessons.length === 0 && (
          <p className="text-slate-400 bg-slate-800 p-4 rounded">
            {isTeacher ? 'Создайте первый урок в редакторе справа →' : 'Пока нет уроков. Попросите учителя добавить материалы.'}
          </p>
        )}
        {lessons.map(l => (
          <div key={l.id} className="bg-slate-800 p-4 rounded">
            <h3 className="text-lg font-bold">{l.title}</h3>
            <div className="text-sm text-slate-300 whitespace-pre-wrap mt-2">{l.content}</div>
            {l.task && (
              <div className="mt-3 p-3 bg-yellow-900/30 rounded border-l-4 border-yellow-500">
                <b>Задача:</b> {l.task}
              </div>
            )}
            <div className="mt-3 flex gap-2 flex-wrap">
              <button onClick={() => onOpenInSimulator && onOpenInSimulator(l)}
                className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm">
                Открыть в симуляторе
              </button>
              {isTeacher && (
                <>
                  <button onClick={() => setEditing(l)}
                    className="px-3 py-1 bg-blue-600 rounded text-sm">Редактировать</button>
                  <button onClick={() => remove(l.id)}
                    className="px-3 py-1 bg-red-600 rounded text-sm">Удалить</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {isTeacher && (
        <div className="bg-slate-800 p-4 rounded h-fit sticky top-4">
          <h3 className="font-bold mb-2">{editing?.id ? 'Редактирование' : 'Новый урок'}</h3>
          <input placeholder="Заголовок" value={editing?.title || ''}
            onChange={e => setEditing({ ...(editing || {}), title: e.target.value })}
            className="w-full p-2 mb-2 bg-slate-700 rounded"/>
          <textarea placeholder="Содержание урока..." rows="6" value={editing?.content || ''}
            onChange={e => setEditing({ ...(editing || {}), content: e.target.value })}
            className="w-full p-2 mb-2 bg-slate-700 rounded"/>
          <textarea placeholder="Задача для ученика..." rows="3" value={editing?.task || ''}
            onChange={e => setEditing({ ...(editing || {}), task: e.target.value })}
            className="w-full p-2 mb-2 bg-slate-700 rounded"/>
          <button onClick={save} className="w-full bg-green-600 hover:bg-green-500 p-2 rounded">
            Сохранить
          </button>
          {editing && (
            <button onClick={() => setEditing(null)}
              className="w-full mt-2 bg-slate-600 p-2 rounded">Отмена</button>
          )}
        </div>
      )}
    </div>
  );
}
