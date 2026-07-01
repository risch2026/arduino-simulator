import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export function useTeacherSocket({ teacherId, classroomId }) {
  const socketRef = useRef(null);
  const [students, setStudents] = useState([]);
  const [liveView, setLiveView] = useState(null);

  useEffect(() => {
    const socket = io('http://localhost:4001');
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Учитель подключён');
      socket.emit('teacher:join', { teacherId, classroomId });
    });

    socket.on('teacher:studentsList', (list) => {
      console.log('📋 Получен список учеников:', list.length);
      setStudents(list);
    });

    socket.on('teacher:studentJoined', (student) => {
      console.log('👨‍🎓 Ученик присоединился:', student.studentName);
      setStudents(prev => {
        // Проверяем, нет ли уже такого ученика
        const exists = prev.some(s => s.studentId === student.studentId);
        if (exists) {
          return prev.map(s => s.studentId === student.studentId ? { ...s, ...student } : s);
        }
        return [...prev, student];
      });
    });

    socket.on('teacher:studentLeft', ({ studentId }) => {
      console.log('👋 Ученик покинул:', studentId);
      setStudents(prev => prev.filter(s => s.studentId !== studentId));
    });

    socket.on('teacher:studentUpdate', (update) => {
      setStudents(prev => prev.map(s => 
        s.studentId === update.studentId ? { ...s, ...update } : s
      ));
    });

    socket.on('teacher:screenUpdate', ({ studentId, state }) => {
      setLiveView({ studentId, ...state });
    });

    return () => {
      socket.disconnect();
    };
  }, [teacherId, classroomId]);

  const requestScreen = (studentSocketId) => {
    socketRef.current?.emit('teacher:requestScreen', { studentSocketId });
  };

  const sendMessage = (studentSocketId, message) => {
    socketRef.current?.emit('teacher:message', { studentSocketId, message });
  };

  const runStudentCode = (studentSocketId, code) => {
    socketRef.current?.emit('teacher:runCode', { studentSocketId, code });
  };

  return { students, liveView, requestScreen, sendMessage, runStudentCode };
}
