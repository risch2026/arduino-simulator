import { useState } from 'react';

export default function TestEditor({ lesson, onClose, onSave }) {
  const [test, setTest] = useState(lesson.test || {
    id: lesson.testId || 'test-' + Date.now(),
    title: lesson.title,
    description: 'Тест к уроку: ' + lesson.title,
    tests: [
      { name: 'Проверка 1', type: 'code-check', pattern: 'void setup' }
    ],
    solution: ''
  });

  const addTestItem = () => {
    setTest(prev => ({
      ...prev,
      tests: [...prev.tests, { name: 'Новая проверка', type: 'code-check', pattern: '' }]
    }));
  };

  const updateTestItem = (index, field, value) => {
    setTest(prev => ({
      ...prev,
      tests: prev.tests.map((t, i) => i === index ? { ...t, [field]: value } : t)
    }));
  };

  const removeTestItem = (index) => {
    setTest(prev => ({
      ...prev,
      tests: prev.tests.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    onSave(test);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(test, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = test.id + '.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        setTest(imported);
      } catch (err) {
        alert('Ошибка импорта: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-700">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800">
          <h2 className="text-xl font-bold">📝 Редактор теста: {lesson.title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Название теста</label>
            <input
              type="text"
              value={test.title}
              onChange={(e) => setTest({ ...test, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Описание</label>
            <textarea
              value={test.description}
              onChange={(e) => setTest({ ...test, description: e.target.value })}
              rows="2"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-slate-400">Проверки ({test.tests.length})</label>
              <button
                onClick={addTestItem}
                className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm"
              >
                + Добавить проверку
              </button>
            </div>

            {test.tests.map((t, i) => (
              <div key={i} className="bg-slate-900 p-3 rounded mb-2 border border-slate-700">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={t.name}
                    onChange={(e) => updateTestItem(i, 'name', e.target.value)}
                    placeholder="Название проверки"
                    className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white"
                  />
                  <select
                    value={t.type}
                    onChange={(e) => updateTestItem(i, 'type', e.target.value)}
                    className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white"
                  >
                    <option value="code-check">Проверка кода (regex)</option>
                    <option value="simulation">Симуляция</option>
                  </select>
                  <button
                    onClick={() => removeTestItem(i)}
                    className="px-2 py-1 bg-red-700 hover:bg-red-600 rounded text-sm"
                  >
                    🗑
                  </button>
                </div>
                {t.type === 'code-check' && (
                  <input
                    type="text"
                    value={t.pattern}
                    onChange={(e) => updateTestItem(i, 'pattern', e.target.value)}
                    placeholder="Регулярное выражение, например: pinMode\\s*\\(\\s*13"
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white font-mono"
                  />
                )}
                {t.type === 'simulation' && (
                  <textarea
                    value={JSON.stringify(t.expected || [], null, 2)}
                    onChange={(e) => {
                      try {
                        updateTestItem(i, 'expected', JSON.parse(e.target.value));
                      } catch {}
                    }}
                    placeholder='[{"pin": 13, "value": 1, "at": 0}]'
                    rows="3"
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white font-mono"
                  />
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Решение (эталонный код)</label>
            <textarea
              value={test.solution}
              onChange={(e) => setTest({ ...test, solution: e.target.value })}
              rows="8"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white font-mono text-sm"
              placeholder="void setup() { ... }"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-700 flex gap-2 sticky bottom-0 bg-slate-800">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded"
          >
            💾 Сохранить тест
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded"
          >
            📤 Экспорт JSON
          </button>
          <label className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded cursor-pointer">
            📥 Импорт JSON
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded ml-auto"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
