import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTeacherSocket } from '../../hooks/useTeacherSocket';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { students, liveView, requestScreen, sendMessage, runStudentCode } = useTeacherSocket({
    teacherId: user?.teacherId || 'teacher-1',
    classroomId: user?.classroomId || 'class-1'
  });

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [executionResults, setExecutionResults] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Проверка прав доступа
  if (!user || user.role !== 'teacher') {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-xl">Доступ только для учителей</p>
          <p className="text-slate-400 mt-2">Войдите как учитель, чтобы увидеть панель</p>
        </div>
      </div>
    );
  }

  

  const executeStudentCode = async () => {
    if (!selectedStudent || !selectedStudent.code) {
      alert('У ученика нет кода для запуска');
      return;
    }

    setIsExecuting(true);
    setExecutionResults(null);
    setConsoleLog(prev => [...prev, '▶ Запуск кода ученика...']);

    try {
      // Отправляем код на backend для выполнения
      const response = await fetch('http://localhost:4001/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: selectedStudent.code,
          studentId: selectedStudent.studentId
        })
      });

      const result = await response.json();
      setExecutionResults(result);
      
      if (result.success) {
        setConsoleLog(prev => [...prev, '✅ Код выполнен успешно']);
      } else {
        setConsoleLog(prev => [...prev, '❌ Ошибка: ' + result.error]);
      }
    } catch (err) {
      setExecutionResults({ success: false, error: err.message });
      setConsoleLog(prev => [...prev, '❌ Ошибка выполнения: ' + err.message]);
    }

    setIsExecuting(false);
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedStudent) return;
    sendMessage(selectedStudent.socketId, messageText);
    setMessageText('');
    setShowMessageInput(false);
  };

  return (
    <div className="h-full flex bg-slate-900 text-white">
      {/* Список учеников */}
      <div className="w-80 border-r border-slate-700 p-4 overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-xl font-bold">👥 Ученики</h2>
          <p className="text-sm text-slate-400 mt-1">
            Онлайн: {students.length} | Класс: {user?.classroomId || 'class-1'}
          </p>
        </div>

        {students.length === 0 && (
          <div className="text-center text-slate-500 py-8">
            <div className="text-4xl mb-2">📭</div>
            <p>Нет подключённых учеников</p>
            <p className="text-xs mt-2">Ожидание подключения...</p>
          </div>
        )}

        {students.map(s => (
          <div
            key={s.studentId}
            className={`p-3 mb-2 rounded cursor-pointer transition ${
              selectedStudent?.studentId === s.studentId
                ? 'bg-blue-700'
                : 'bg-slate-800 hover:bg-slate-700'
            }`}
            onClick={() => {
              setSelectedStudent(s);
              setShowMessageInput(false);
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">👨‍🎓 {s.studentName || 'Ученик'}</span>
              {s.running && (
                <span className="text-xs bg-green-600 px-2 py-0.5 rounded animate-pulse">
                  ▶
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {s.code ? `📝 ${s.code.length} символов` : 'Нет кода'}
            </div>
          </div>
        ))}
      </div>

      {/* Основная область */}
      <div className="flex-1 flex flex-col">
        {selectedStudent ? (
          <>
            {/* Заголовок */}
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
              <div>
                <h3 className="text-lg font-bold">
                  👨‍🎓 {selectedStudent.studentName || 'Ученик'}
                </h3>
                <p className="text-xs text-slate-400">ID: {selectedStudent.studentId}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => requestScreen(selectedStudent.socketId)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
                >
                  👁 Live view
                </button>
                <button
                  onClick={() => {
                    if (selectedStudent.code) {
                      runStudentCode(selectedStudent.socketId, selectedStudent.code);
                      alert('Команда запуска отправлена ученику');
                    } else {
                      alert('У ученика нет кода для запуска');
                    }
                  }}
                  className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm"
                >
                  ▶ Запустить код ученика
                </button>
                <button
                  onClick={() => setShowMessageInput(!showMessageInput)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm"
                >
                  💬 Сообщение
                </button>
              </div>
            </div>

            {/* Поле ввода сообщения */}
            {showMessageInput && (
              <div className="p-3 border-b border-slate-700 bg-slate-800 flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Введите сообщение..."
                  className="flex-1 px-3 py-1 bg-slate-700 border border-slate-600 rounded text-white"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-1 bg-green-600 hover:bg-green-500 rounded"
                >
                  Отправить
                </button>
              </div>
            )}

            {/* Код ученика */}
            <div className="flex-1 p-4 overflow-auto">
              <h4 className="text-sm font-bold mb-2 text-slate-400">💻 Код ученика:</h4>
              <pre className="bg-black p-4 rounded font-mono text-sm text-green-400 whitespace-pre-wrap">
                {selectedStudent.code || '// Нет кода'}
              </pre>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <div className="text-6xl mb-4">👈</div>
              <p className="text-lg">Выберите ученика из списка</p>
              <p className="text-sm mt-2">для просмотра его работы</p>
            </div>
          </div>
        )}

        {/* Live view панель */}
        {liveView && (
          <div className="h-64 border-t border-slate-700 p-4 bg-slate-800 overflow-auto">
            <h4 className="font-bold mb-2">🔴 Live: {liveView.studentId}</h4>
            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
              {JSON.stringify(liveView, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
