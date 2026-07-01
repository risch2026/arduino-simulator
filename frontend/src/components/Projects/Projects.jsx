import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_PROJECTS = [
  {
    id: 1,
    title: 'Светофор',
    description: 'Три светодиода переключаются по очереди',
    difficulty: 'Легко',
    components: ['3x LED', '3x резистор 220 Ом'],
    code: 'void setup() {\n  pinMode(11, OUTPUT);\n  pinMode(12, OUTPUT);\n  pinMode(13, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(11, HIGH);\n  delay(1000);\n  digitalWrite(11, LOW);\n  digitalWrite(12, HIGH);\n  delay(1000);\n  digitalWrite(12, LOW);\n  digitalWrite(13, HIGH);\n  delay(1000);\n  digitalWrite(13, LOW);\n}',
    status: 'not-started'
  }
];

export default function Projects() {
  const { isTeacher, user } = useAuth();
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('projects_' + (user?.studentId || 'default'));
      return saved ? JSON.parse(saved) : DEFAULT_PROJECTS;
    } catch { return DEFAULT_PROJECTS; }
  });
  const [selectedProject, setSelectedProject] = useState(null);
  const [editing, setEditing] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    localStorage.setItem('projects_' + (user?.studentId || 'default'), JSON.stringify(projects));
  }, [projects, user]);

  const updateProject = (updated) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedProject(updated);
  };

  const addProject = () => {
    const newProject = {
      id: Date.now(),
      title: 'Новый проект',
      description: 'Описание проекта',
      difficulty: 'Средне',
      components: [],
      code: 'void setup() {\n  \n}\n\nvoid loop() {\n  \n}',
      status: 'not-started'
    };
    setProjects(prev => [...prev, newProject]);
    setSelectedProject(newProject);
    setEditing(true);
  };

  const deleteProject = (id) => {
    if (confirm('Удалить проект?')) {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (selectedProject?.id === id) setSelectedProject(null);
    }
  };

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  const DIFFICULTY_COLORS = {
    'Легко': 'bg-green-700',
    'Средне': 'bg-yellow-700',
    'Сложно': 'bg-red-700'
  };

  const STATUS_LABELS = {
    'not-started': { label: 'Не начат', color: 'text-slate-400' },
    'in-progress': { label: 'В работе', color: 'text-blue-400' },
    'completed': { label: 'Завершён', color: 'text-green-400' }
  };

  return (
    <div className="h-full flex">
      <div className="w-96 border-r border-slate-700 overflow-y-auto">
        <div className="p-4 border-b border-slate-700">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold">📁 Мои проекты</h2>
            <button
              onClick={addProject}
              className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm"
            >
              + Новый
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'not-started', 'in-progress', 'completed'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 rounded text-xs ${
                  filter === f ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                {f === 'all' ? 'Все' : STATUS_LABELS[f].label}
              </button>
            ))}
          </div>
        </div>
        {filtered.map(project => (
          <div
            key={project.id}
            className={`p-4 border-b border-slate-700 cursor-pointer transition-colors ${
              selectedProject?.id === project.id ? 'bg-blue-900' : 'hover:bg-slate-800'
            }`}
            onClick={() => { setSelectedProject(project); setEditing(false); }}
          >
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-white">{project.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded ${DIFFICULTY_COLORS[project.difficulty]}`}>
                {project.difficulty}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">{project.description}</p>
            <div className={`text-xs mt-2 ${STATUS_LABELS[project.status].color}`}>
              ● {STATUS_LABELS[project.status].label}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {selectedProject ? (
          <div>
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold">{selectedProject.title}</h1>
              <div className="flex gap-2">
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
                  >
                    ✏️ Редактировать
                  </button>
                )}
                <button
                  onClick={() => deleteProject(selectedProject.id)}
                  className="px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-sm"
                >
                  🗑 Удалить
                </button>
              </div>
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Название</label>
                  <input
                    type="text"
                    value={selectedProject.title}
                    onChange={(e) => updateProject({ ...selectedProject, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Описание</label>
                  <textarea
                    value={selectedProject.description}
                    onChange={(e) => updateProject({ ...selectedProject, description: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Сложность</label>
                    <select
                      value={selectedProject.difficulty}
                      onChange={(e) => updateProject({ ...selectedProject, difficulty: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                    >
                      <option>Легко</option>
                      <option>Средне</option>
                      <option>Сложно</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Статус</label>
                    <select
                      value={selectedProject.status}
                      onChange={(e) => updateProject({ ...selectedProject, status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                    >
                      <option value="not-started">Не начат</option>
                      <option value="in-progress">В работе</option>
                      <option value="completed">Завершён</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Компоненты (через запятую)</label>
                  <input
                    type="text"
                    value={selectedProject.components.join(', ')}
                    onChange={(e) => updateProject({
                      ...selectedProject,
                      components: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Код программы</label>
                  <textarea
                    value={selectedProject.code}
                    onChange={(e) => updateProject({ ...selectedProject, code: e.target.value })}
                    rows="15"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white font-mono text-sm"
                  />
                </div>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded"
                >
                  ✅ Сохранить
                </button>
              </div>
            ) : (
              <div>
                <p className="text-slate-300 mb-4">{selectedProject.description}</p>
                <div className="mb-4">
                  <h3 className="font-bold mb-2">📦 Компоненты:</h3>
                  <ul className="list-disc list-inside text-slate-300">
                    {selectedProject.components.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold mb-2">💻 Код:</h3>
                  <pre className="bg-black p-4 rounded overflow-x-auto text-sm text-green-400 font-mono">
                    <code>{selectedProject.code}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <div className="text-6xl mb-4">📁</div>
              <p className="text-lg">Выберите или создайте проект</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
