import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export function useStudentSocket({ studentId, studentName, classroomId, code, blocks, running }) {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io('http://localhost:4001');
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Подключено к серверу');
      socket.emit('student:join', { 
        studentId, 
        studentName: studentName || 'Ученик', 
        classroomId 
      });
    });

    socket.on('student:screenRequest', () => {
      socket.emit('student:screenState', { code, blocks, running });
    });

    socket.on('teacher:runCode', (data) => {
      console.log('🚀 Получена команда запуска кода от учителя');
      // Отправляем событие в компонент
      if (window.onTeacherRunCode) {
        window.onTeacherRunCode(data.code);
      }
    });

    socket.on('student:message', (data) => {
      alert(' Сообщение от учителя: ' + data.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [studentId, studentName, classroomId]);

  // Отправляем код при изменении
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('student:codeUpdate', { code, blocks, running });
    }
  }, [code, blocks, running]);

  return socketRef.current;
}
