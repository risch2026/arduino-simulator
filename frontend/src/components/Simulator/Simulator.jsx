import { useState, useRef, useEffect, useCallback } from 'react';
import Canvas from './Canvas';
import CodeEditor from './CodeEditor';
import Inspector from './Inspector';
import { ArduinoEngine } from './engine';
import { exportCircuitJSON, importCircuitJSON, exportIno } from '../../utils/export';
import { useStudentSocket } from '../../hooks/useStudentSocket';
import { useAuth } from '../../store/auth';
import { TestRunner } from '../../utils/testRunner';

const DEFAULT_CODE = `void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(500);
  digitalWrite(13, LOW);
  delay(500);
}`;

const LAYOUT_KEY = 'simulator_layout';
const DEFAULT_LAYOUT = {
  leftWidth: 50,
  inspectorHeight: 180,
  consoleHeight: 140
};

export default function Simulator() {
  const { isTeacher, user } = useAuth();

  // === Состояния ===
  const [parts, setParts] = useState([]);
  const [wires, setWires] = useState([]);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [mode, setMode] = useState('text');
  const [running, setRunning] = useState(false);
  const [consoleLog, setConsoleLog] = useState(['Готов к запуску']);
  const [selectedId, setSelectedId] = useState(null);
  const [currentLine, setCurrentLine] = useState(null);
  const [executionTime, setExecutionTime] = useState(0);
  const [speedDisplay, setSpeedDisplay] = useState(150);

  // Состояния для тестов
  const [currentTest, setCurrentTest] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [testRunning, setTestRunning] = useState(false);
  const [testProgress, setTestProgress] = useState(null);

  const [layout, setLayout] = useState(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_KEY);
      return saved ? { ...DEFAULT_LAYOUT, ...JSON.parse(saved) } : DEFAULT_LAYOUT;
    } catch {
      return DEFAULT_LAYOUT;
    }
  });

  // === Refs ===
  const containerRef = useRef(null);
  const engineRef = useRef(new ArduinoEngine());
  const dragRef = useRef(null);
  const liveStyleRef = useRef({});
  const timerRef = useRef(null);
  const testRunnerRef = useRef(null);

  // === Обработчик команды запуска от учителя ===
  useEffect(() => {
    window.onTeacherRunCode = (code) => {
      console.log(' Получена команда запуска кода от учителя');
      setCode(code);
      setConsoleLog(prev => [...prev, '🚀 Запуск кода от учителя...']);
      
      // Запускаем код через небольшую задержку
      setTimeout(() => {
        // Находим кнопку запуска и кликаем
        const buttons = document.querySelectorAll('button');
        const startButton = Array.from(buttons).find(b => 
          b.textContent.includes('Запустить') && !b.disabled
        );
        
        if (startButton) {
          console.log('✅ Нажата кнопка запуска');
          startButton.click();
        } else {
          console.warn('⚠️ Кнопка запуска не найдена или заблокирована');
          // Принудительно вызываем start
          if (typeof start === 'function') {
            start();
          }
        }
      }, 200);
    };

    return () => {
      window.onTeacherRunCode = null;
    };
  }, []);

  // === WebSocket ===
  const studentSocket = useStudentSocket({
    studentId: user?.studentId || 'student-1',
    studentName: user?.name || 'Ученик',
    classroomId: user?.classroomId || 'class-1',
    code,
    blocks: null,
    running
  });

  // === Эффект: настройки engine ===
  useEffect(() => {
    engineRef.current.onLog = (msg) => setConsoleLog(prev => [...prev.slice(-50), msg]);
    engineRef.current.onUpdate = (states) => {
      setParts(prev => prev.map(p =>
        states[p.id] ? { ...p, state: { ...p.state, ...states[p.id] } } : p
      ));
    };
    engineRef.current.onLine = (lineInfo) => {
      setCurrentLine(lineInfo);
      if (!lineInfo) {
        if (window._monacoEditor && window._currentDecorations) {
          window._monacoEditor.deltaDecorations(window._currentDecorations, []);
          window._currentDecorations = null;
        }
        if (window.clearBlocklyHighlight) window.clearBlocklyHighlight();
        return;
      }
      const realLine = lineInfo.line;
      if (mode === 'visual' && window.highlightBlocklyBlock) {
        window.highlightBlocklyBlock(realLine);
      }
      if (mode === 'text') {
        const editor = window._monacoEditor;
        const monaco = window._monaco;
        if (!editor || !monaco) return;
        if (window._currentDecorations) {
          editor.deltaDecorations(window._currentDecorations, []);
        }
        try {
          const decorations = editor.deltaDecorations([], [{
            range: new monaco.Range(realLine, 1, realLine, 1),
            options: {
              isWholeLine: true,
              className: 'current-line-highlight',
              linesDecorationsClassName: 'current-line-glyph'
            }
          }]);
          window._currentDecorations = decorations;
          editor.revealLineInCenter(realLine);
        } catch (e) {
          console.warn('Ошибка подсветки:', e);
        }
      }
    };
  }, [mode]);

  // === Layout CSS ===
  const applyLayout = useCallback((l) => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    el.style.setProperty('--left-width', l.leftWidth + '%');
    el.style.setProperty('--right-width', (100 - l.leftWidth) + '%');
    el.style.setProperty('--inspector-height', l.inspectorHeight + 'px');
    el.style.setProperty('--console-height', l.consoleHeight + 'px');
  }, []);

  useEffect(() => {
    applyLayout(layout);
  }, [layout, applyLayout]);

  // === Drag handlers ===
  const startDrag = useCallback((type, e) => {
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    dragRef.current = { type, rect, startLayout: { ...layout } };
    document.body.style.cursor = type === 'vertical' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [layout]);

  useEffect(() => {
    const onMove = (e) => {
      const drag = dragRef.current;
      if (!drag) return;
      const { type, rect, startLayout } = drag;
      let newLayout = { ...startLayout };
      if (type === 'vertical') {
        const percent = ((e.clientX - rect.left) / rect.width) * 100;
        newLayout.leftWidth = Math.max(20, Math.min(80, percent));
      } else if (type === 'inspector') {
        const pixels = rect.bottom - e.clientY;
        newLayout.inspectorHeight = Math.max(80, Math.min(400, pixels));
      } else if (type === 'console') {
        const pixels = rect.bottom - e.clientY;
        newLayout.consoleHeight = Math.max(60, Math.min(350, pixels));
      }
      applyLayout(newLayout);
      liveStyleRef.current = newLayout;
    };
    const onUp = () => {
      if (dragRef.current) {
        const finalLayout = liveStyleRef.current;
        if (Object.keys(finalLayout).length > 0) {
          setLayout(finalLayout);
          localStorage.setItem(LAYOUT_KEY, JSON.stringify(finalLayout));
        }
        dragRef.current = null;
        liveStyleRef.current = {};
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [applyLayout]);

  // === Очистка подсветки ===
  const clearAllHighlights = () => {
    if (window.clearBlocklyHighlight) window.clearBlocklyHighlight();
    if (window._monacoEditor && window._currentDecorations) {
      window._monacoEditor.deltaDecorations(window._currentDecorations, []);
      window._currentDecorations = null;
    }
    setCurrentLine(null);
  };

  // === Запуск программы ===
  const start = async () => {
    setRunning(true);
    setConsoleLog(['▶ Запуск...']);
    setExecutionTime(0);
    engineRef.current.setCircuit(parts, wires);
    clearAllHighlights();
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setExecutionTime(((Date.now() - startTime) / 1000).toFixed(1));
    }, 100);
    try {
      await engineRef.current.run(code);
    } catch (e) {
      setConsoleLog(prev => [...prev, '❌ ' + e.message]);
    }
    // Гарантированная очистка после завершения
    setRunning(false);
    clearInterval(timerRef.current);
    clearAllHighlights();
  };

  // === Остановка программы ===
  const stop = () => {
    engineRef.current.stop();
    setRunning(false);
    clearInterval(timerRef.current);
    clearAllHighlights();
    setConsoleLog(prev => [...prev, '⏹ Остановлено']);
  };

  // === Тестирование ===
  const loadTestFile = async (file) => {
    try {
      const text = await file.text();
      const test = JSON.parse(text);
      setCurrentTest(test);
      setTestResults(null);
      setConsoleLog(prev => [...prev, '✅ Тест загружен: ' + test.title]);
      if (test.initialCode) {
        setCode(test.initialCode);
      }
    } catch (err) {
      setConsoleLog(prev => [...prev, '❌ Ошибка загрузки теста: ' + err.message]);
    }
  };

  const runTests = async () => {
    if (!currentTest) {
      setConsoleLog(prev => [...prev, '⚠ Сначала загрузите тест']);
      return;
    }
    setTestRunning(true);
    setTestResults(null);
    setTestProgress({ current: 0, total: currentTest.tests.length, status: 'running' });
    setConsoleLog(prev => [...prev, '▶ Запуск тестов...']);
    try {
      const runner = new TestRunner(engineRef.current);
      testRunnerRef.current = runner;
      runner.setProgressCallback((progress) => {
        setTestProgress(progress);
        setConsoleLog(prev => [...prev, '  Тест ' + progress.current + '/' + progress.total + ': ' + (progress.testName || 'завершение')]);
      });
      const results = await runner.run(currentTest, code);
      setTestResults(results);
      setTestProgress(null);
      if (results.cancelled) {
        setConsoleLog(prev => [...prev, '⏹ Тестирование остановлено']);
      } else {
        setConsoleLog(prev => [...prev, '✅ Тесты завершены: ' + results.passed + '/' + results.total + ' пройдено']);
        results.results.forEach(r => {
          if (r.skipped) {
            setConsoleLog(prev => [...prev, '⏹ ' + r.name + ': ' + r.message]);
          } else {
            setConsoleLog(prev => [...prev, (r.passed ? '✅' : '❌') + ' ' + r.name + ': ' + r.message]);
          }
        });
      }
    } catch (err) {
      setConsoleLog(prev => [...prev, '❌ Ошибка тестирования: ' + err.message]);
      setTestProgress(null);
    }
    setTestRunning(false);
    testRunnerRef.current = null;
  };

  const stopTests = () => {
    if (testRunnerRef.current) {
      testRunnerRef.current.cancel();
      setTestRunning(false);
      setTestProgress(null);
      setConsoleLog(prev => [...prev, '⏹ Тестирование остановлено пользователем']);
    }
  };

  const showSolution = () => {
    if (currentTest && currentTest.solution) {
      setCode(currentTest.solution);
      setConsoleLog(prev => [...prev, '👁 Показано решение']);
    }
  };

  const updatePart = useCallback((part) => {
    setParts(prev => prev.map(p => p.id === part.id ? part : p));
  }, []);

  const selectedPart = parts.find(p => p.id === selectedId);

  // === Render ===
  return (
    <div
      ref={containerRef}
      className="h-[calc(100vh-90px)] flex flex-col"
      style={{
        '--left-width': layout.leftWidth + '%',
        '--right-width': (100 - layout.leftWidth) + '%',
        '--inspector-height': layout.inspectorHeight + 'px',
        '--console-height': layout.consoleHeight + 'px'
      }}
    >
      {/* Панель управления */}
      <div className="flex gap-2 p-2 bg-slate-800 border-b border-slate-700 flex-wrap items-center shrink-0">
        <button onClick={start} disabled={running}
          className="px-4 py-1 bg-green-600 hover:bg-green-500 rounded text-sm disabled:opacity-50">
          ▶ Запустить
        </button>
        <button onClick={stop} disabled={!running}
          className="px-4 py-1 bg-red-600 hover:bg-red-500 rounded text-sm disabled:opacity-50">
          ⏹ Стоп
        </button>

        {running && (
          <div className="flex items-center gap-2 ml-2 px-3 py-1 bg-slate-700 rounded text-xs">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
            <span className="text-green-400">Выполняется</span>
            <span className="text-slate-400">|</span>
            <span>{executionTime}с</span>
            {currentLine && (
              <>
                <span className="text-slate-400">|</span>
                <span className="text-yellow-400 font-mono">
                  {currentLine.func}() : строка {currentLine.line}
                </span>
              </>
            )}
          </div>
        )}

        <div className="h-6 w-px bg-slate-600 mx-1"/>

        <label className="flex items-center gap-2 text-xs text-slate-400">
          Скорость:
          <input
            type="range"
            min="0"
            max="500"
            step="50"
            value={speedDisplay}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              engineRef.current.stepDelay = val;
              setSpeedDisplay(val);
            }}
            className="w-24"
          />
          <span className="w-12 text-right">{speedDisplay}мс</span>
        </label>

        <div className="h-6 w-px bg-slate-600 mx-1"/>

        <button onClick={() => exportCircuitJSON(parts, wires)}
          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs">
          💾 Сохранить .json
        </button>
        <button onClick={() => exportIno(code)}
          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs">
          📄 Сохранить код .ino
        </button>
        <label className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded text-xs cursor-pointer">
          📂 Загрузить .json
          <input type="file" accept=".json" className="hidden"
            onChange={async (e) => {
              try {
                const data = await importCircuitJSON(e.target.files[0]);
                setParts(data.parts || []);
                setWires(data.wires || []);
                setConsoleLog(prev => [...prev, '✅ Схема загружена']);
              } catch (err) {
                setConsoleLog(prev => [...prev, '❌ Ошибка загрузки: ' + err.message]);
              }
            }}/>
        </label>

        <button onClick={() => {
          setLayout(DEFAULT_LAYOUT);
          localStorage.removeItem(LAYOUT_KEY);
        }} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs">
          ↺ Сбросить размеры
        </button>

        {/* Блок тестирования — только для учителя */}
        <div className="h-6 w-px bg-slate-600 mx-1"/>

        {isTeacher ? (
          <>
            <label className="px-3 py-1 bg-purple-700 hover:bg-purple-600 rounded text-xs cursor-pointer">
               Загрузить тест
              <input type="file" accept=".json" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) await loadTestFile(file);
                }}/>
            </label>

            {testRunning ? (
              <button onClick={stopTests}
                className="px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-xs font-bold animate-pulse">
                ⏹ Остановить проверку
              </button>
            ) : (
              <button onClick={runTests} disabled={!currentTest}
                className="px-3 py-1 bg-green-700 hover:bg-green-600 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                ✅ Проверить задачу
              </button>
            )}

            <button onClick={showSolution} disabled={!currentTest}
              className="px-3 py-1 bg-yellow-700 hover:bg-yellow-600 rounded text-xs disabled:opacity-50">
               Показать решение
            </button>
          </>
        ) : (
          <span className="px-3 py-1 bg-slate-700 rounded text-xs text-slate-500" title="Только для учителя">
            🔒 Тесты доступны учителю
          </span>
        )}

        <span className="ml-auto text-sm text-slate-400 self-center">
          Режим: {mode === 'visual' ? 'Визуальный' : 'Текстовый'}
        </span>
      </div>

      {/* Прогресс тестирования */}
      {testProgress && testRunning && (
        <div className="border-t border-slate-700 bg-slate-800 p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-white">
              Тест {testProgress.current} из {testProgress.total}
            </span>
            <span className="text-xs text-slate-400">
              {Math.round((testProgress.current / testProgress.total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: Math.round((testProgress.current / testProgress.total) * 100) + '%' }}
            />
          </div>
        </div>
      )}

      {/* Основная область */}
      <div className="flex-1 flex min-h-0">
        {/* Левая колонка */}
        <div
          className="flex flex-col min-h-0 overflow-hidden"
          style={{ width: 'var(--left-width)' }}
        >
          <div className="flex-1 min-h-0">
            <Canvas
              parts={parts} setParts={setParts}
              wires={wires} setWires={setWires}
              selectedId={selectedId} setSelectedId={setSelectedId}
            />
          </div>
          <div
            onMouseDown={(e) => startDrag('inspector', e)}
            className="h-1 bg-slate-700 hover:bg-blue-500 cursor-row-resize transition-colors shrink-0"
          />
          <div
            className="overflow-auto border-t border-slate-700 shrink-0"
            style={{ height: 'var(--inspector-height)' }}
          >
            <Inspector part={selectedPart} onChange={updatePart}/>
          </div>
        </div>

        {/* Вертикальный разделитель */}
        <div
          onMouseDown={(e) => startDrag('vertical', e)}
          className="w-1 bg-slate-700 hover:bg-blue-500 cursor-col-resize transition-colors shrink-0 relative group"
        >
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-slate-500 group-hover:bg-white"/>
        </div>

        {/* Правая колонка */}
        <div
          className="flex flex-col min-h-0 overflow-hidden"
          style={{ width: 'var(--right-width)' }}
        >
          <div className="flex-1 min-h-0">
            <CodeEditor code={code} setCode={setCode} mode={mode} setMode={setMode}/>
          </div>
          <div
            onMouseDown={(e) => startDrag('console', e)}
            className="h-1 bg-slate-700 hover:bg-blue-500 cursor-row-resize transition-colors shrink-0"
          />
          <div
            className="bg-black p-2 overflow-auto font-mono text-xs text-green-400 border-t border-slate-700 shrink-0"
            style={{ height: 'var(--console-height)' }}
          >
            <div className="flex justify-between text-slate-500 mb-1 border-b border-slate-800 pb-1">
              <span>Serial Monitor</span>
              <button onClick={() => setConsoleLog([])}
                className="text-slate-600 hover:text-slate-400 text-xs">очистить</button>
            </div>
            {consoleLog.map((l, i) => (
              <div key={i} className={
                l.startsWith('▶') ? 'text-green-400' :
                l.startsWith('⏹') ? 'text-red-400' :
                l.startsWith('❌') ? 'text-red-500' :
                l.startsWith('⚠') ? 'text-yellow-400' :
                l.startsWith('→') ? 'text-blue-400' :
                l.startsWith('[Serial]') ? 'text-cyan-300' :
                l.startsWith('✅') ? 'text-green-300' :
                'text-green-300'
              }>{l}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Панель результатов тестов */}
      {testResults && (
        <div className="border-t border-slate-700 bg-slate-800 p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-white">
               Результаты: {testResults.title}
            </h3>
            <span className={`px-3 py-1 rounded text-sm font-bold ${
              testResults.passed === testResults.total
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            }`}>
              {testResults.passed}/{testResults.total}
            </span>
          </div>
          <div className="space-y-1">
            {testResults.results.map((r, i) => (
              <div key={i} className={`p-2 rounded text-sm ${
                r.passed ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
              }`}>
                {r.passed ? '✅' : '❌'} <strong>{r.name}</strong>: {r.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
