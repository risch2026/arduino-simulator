import { useState } from 'react';

const LESSONS = [
  { id: 1, title: 'Урок 1: Знакомство с Arduino', description: 'Что такое Arduino', content: 'Arduino — это платформа для создания электронных устройств.' },
  { id: 2, title: 'Урок 2: Мигание светодиодом', description: 'Первая программа — Blink', content: 'void setup() {\n  pinMode(13, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(500);\n  digitalWrite(13, LOW);\n  delay(500);\n}' }
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
            className={`p-4 border-b border-slate-700 cursor-pointer ${
              selectedLesson?.id === lesson.id ? 'bg-blue-900' : 'hover:bg-slate-800'
            }`}
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
