import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import BlocklyEditor from './BlocklyEditor';

export default function CodeEditor({ code, setCode, mode, setMode }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const isInternalChange = useRef(false);

  // Когда code меняется извне (от Blockly) — обновляем Monaco
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== code) {
        editorRef.current.setValue(code || '');
      }
    }
    isInternalChange.current = false;
  }, [code]);

  const handleTextChange = (newValue) => {
    isInternalChange.current = true;
    if (setCode) setCode(newValue || '');
  };

  return (
    <div className="h-full flex flex-col bg-slate-800">
      <div className="flex gap-2 p-2 border-b border-slate-700">
        <button
          onClick={() => setMode('visual')}
          className={`px-3 py-1.5 rounded text-sm ${
            mode === 'visual' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
          }`}
        >
          🧩 Блоки
        </button>
        <button
          onClick={() => setMode('text')}
          className={`px-3 py-1.5 rounded text-sm ${
            mode === 'text' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
          }`}
        >
          📝 Текст
        </button>
        <span className="ml-auto text-xs text-slate-400 self-center">
          {mode === 'visual' ? 'Блоки генерируют код' : 'Текстовый режим'}
        </span>
      </div>

      <div className="flex-1 overflow-hidden min-h-0 relative">
        <div
          className="absolute inset-0"
          style={{ display: mode === 'visual' ? 'block' : 'none' }}
        >
          <BlocklyEditor setCode={setCode} visible={mode === 'visual'}/>
        </div>

        <div
          className="absolute inset-0"
          style={{ display: mode === 'text' ? 'block' : 'none' }}
        >
          <Editor
            height="100%"
            theme="vs-dark"
            language="cpp"
            defaultValue={code}
            onChange={handleTextChange}
            onMount={(editor, monaco) => {
              editorRef.current = editor;
              monacoRef.current = monaco;
              window._monacoEditor = editor;
              window._monaco = monaco;
              // Устанавливаем начальное значение
              editor.setValue(code || '');
              setTimeout(() => editor.layout(), 100);
            }}
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2
            }}
          />
        </div>
      </div>
    </div>
  );
}