import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import TestEditor from './TestEditor';

const DEFAULT_LESSONS = [
  {
    id: 1,
    title: 'Урок 1: Знакомство с Arduino',
    description: 'Что такое Arduino, из чего состоит плата',
    content: 'Arduino — это платформа для создания электронных устройств.\n\nОсновные компоненты:\n- Микроконтроллер\n- Цифровые пины (0-13)\n- Аналоговые пины (A0-A5)\n- Питание 5V и 3.3V',
    image: null,
    testId: 'intro-101',
    test: null
  },
  {
    id: 2,
    title: 'Урок 2: Мигание светодиодом',
    description: 'Первая программа — Blink',
    content: 'Светодиод подключается к пину 13 через резистор 220 Ом.\n\n```cpp\nvoid setup() {\n  pinMode(13, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(500);\n  digitalWrite(13, LOW);\n  delay(500);\n}\n```',
    image: null,
    testId: 'blink-101',
    test: null
  }
];

export default function Materials() {
  const { isTeacher } = useAuth();
  const [lessons, setLessons] = useState(() => {
    try {
      const saved = localStorage.getItem('lessons');
      return saved ? JSON.parse(saved) : DEFAULT_LESSONS;
    } catch { return DEFAULT_LESSONS; }
  });
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [editing, setEditing] = useState(false);
  const [showTestEditor, setShowTestEditor] = useState(false);

  useEffect(() => {
    localStorage.setItem('lessons', JSON.stringify(lessons));
  }, [lessons]);

  const updateLesson = (updated) => {
    setLessons(prev => prev.map(l => l.id === updated.id ? updated : l));
    setSelectedLesson(updated);
  };

  const addLesson = () => {
    const newLesson = {
      id: Date.now(),
      title: 'Новый урок',
      description: 'Описание',
      content: 'Содержимое урока...',
      image: null,
      testId: 'lesson-' + Date.now(),
      test: null
    };
    setLessons(prev => [...prev, newLesson]);
    setSelectedLesson(newLesson);
    setEditing(true);
  };

  const deleteLesson = (id) => {
    if (confirm('Удалить урок?')) {
      setLessons(prev => prev.filter(l => l.id !== id));
      if (selectedLesson?.id === id) setSelectedLesson(null);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const updated = { ...selectedLesson, image: ev.target.result };
      updateLesson(updated);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="h-full flex">
      {/* Список уроков */}
      <div className="w-96 border-r border-slate-700 overflow-y-auto">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold"> Учебные материалы</h2>
            <p className="text-sm text-slate-400 mt-1">{lessons.length} уроков</p>
          </div>
          {isTeacher && (
            <button
              onClick={addLesson}
              className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm"
            >
              + Добавить
            </button>
          )}
        </div>
        {lessons.map(lesson => (
          <div
            key={lesson.id}
            className={`p-4 border-b border-slate-700 cursor-pointer transition-colors ${
              selectedLesson?.id === lesson.id ? 'bg-blue-900' : 'hover:bg-slate-800'
            }`}
            onClick={() => { setSelectedLesson(lesson); setEditing(false); }}
          >
            <h3 className="font-medium text-white">{lesson.title}</h3>
            <p className="text-sm text-slate-400 mt-1">{lesson.description}</p>
            {isTeacher && (
              <button
                onClick={(e) => { e.stopPropagation(); deleteLesson(lesson.id); }}
                className="text-xs text-red-400 hover:text-red-300 mt-1"
              >
                🗑 Удалить
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Содержимое урока */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedLesson ? (
          <div>
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold">{selectedLesson.title}</h1>
              {isTeacher && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
                >
                  ✏️ Редактировать
                </button>
              )}
            </div>

            {editing && isTeacher ? (
              // РЕЖИМ РЕДАКТИРОВАНИЯ
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Название</label>
                  <input
                    type="text"
                    value={selectedLesson.title}
                    onChange={(e) => updateLesson({ ...selectedLesson, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Описание</label>
                  <input
                    type="text"
                    value={selectedLesson.description}
                    onChange={(e) => updateLesson({ ...selectedLesson, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Содержимое (поддержка Markdown и блоков кода ```cpp ... ```)
                  </label>
                  <textarea
                    value={selectedLesson.content}
                    onChange={(e) => updateLesson({ ...selectedLesson, content: e.target.value })}
                    rows="15"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Изображение</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  />
                  {selectedLesson.image && (
                    <div className="mt-2">
                      <img src={selectedLesson.image} alt="Preview" className="max-w-md rounded border border-slate-600" />
                      <button
                        onClick={() => updateLesson({ ...selectedLesson, image: null })}
                        className="text-xs text-red-400 mt-1"
                      >
                        Удалить изображение
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded"
                  >
                    ✅ Сохранить
                  </button>
                  <button
                    onClick={() => setShowTestEditor(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded"
                  >
                    📝 Редактировать тест
                  </button>
                </div>
              </div>
            ) : (
              // РЕЖИМ ПРОСМОТРА
              <div className="prose prose-invert max-w-none">
                {selectedLesson.image && (
                  <img src={selectedLesson.image} alt="" className="max-w-2xl rounded mb-4" />
                )}
                <div className="text-slate-300 whitespace-pre-line">
                  {renderContent(selectedLesson.content)}
                </div>
              </div>
            )}
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

      {/* Модальное окно редактора тестов */}
      {showTestEditor && selectedLesson && (
        <TestEditor
          lesson={selectedLesson}
          onClose={() => setShowTestEditor(false)}
          onSave={(test) => {
            updateLesson({ ...selectedLesson, test });
            setShowTestEditor(false);
          }}
        />
      )}
    </div>
  );
}

// Простой рендер содержимого с подсветкой блоков кода
function renderContent(content) {
  if (!content) return '';
  const parts = content.split(/(```\w*\n[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const code = part.replace(/```\w*\n/, '').replace(/```$/, '');
      return (
        <pre key={i} className="bg-black p-3 rounded my-2 overflow-x-auto text-sm text-green-400 font-mono">
          <code>{code}</code>
        </pre>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
