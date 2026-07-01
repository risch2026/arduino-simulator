import { useState } from 'react';

const PROJECTS = [
  { id: 1, title: 'Светофор', description: 'Три светодиода переключаются по очереди', difficulty: 'Легко', code: 'void setup() {\n  pinMode(11, OUTPUT);\n  pinMode(12, OUTPUT);\n  pinMode(13, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(11, HIGH);\n  delay(1000);\n  digitalWrite(11, LOW);\n  digitalWrite(12, HIGH);\n  delay(1000);\n  digitalWrite(12, LOW);\n  digitalWrite(13, HIGH);\n  delay(1000);\n  digitalWrite(13, LOW);\n}', status: 'not-started' }
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
            className={`p-4 border-b border-slate-700 cursor-pointer ${
              selectedProject?.id === project.id ? 'bg-blue-900' : 'hover:bg-slate-800'
            }`}
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
