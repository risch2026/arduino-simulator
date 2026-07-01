import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../store/auth';

export function useSocket() {
  const { user } = useAuth();
  const socketRef = useRef();
  const [students, setStudents] = useState({});

  useEffect(() => {
    if (!user) return;
    try {
      socketRef.current = io('http://localhost:3001', {
        auth: { token: localStorage.getItem('token') }
      });
    } catch (e) {
      console.warn('WS не подключился:', e.message);
      return;
    }

    if (user.role === 'teacher') {
      socketRef.current.on('student:update', (data) => {
        setStudents(prev => ({ ...prev, [data.userId]: data }));
      });
      socketRef.current.on('student:leave', ({ userId }) => {
        setStudents(prev => {
          const copy = { ...prev };
          delete copy[userId];
          return copy;
        });
      });
    }

    socketRef.current.on('teacher:message', ({ from, text }) => {
      alert('Сообщение от учителя ' + from + ':\n' + text);
    });

    return () => {
      try { socketRef.current?.disconnect(); } catch {}
    };
  }, [user]);

  const sendUpdate = (circuit, code) => {
    if (user?.role === 'student' && socketRef.current?.connected) {
      socketRef.current.emit('student:update', { circuit, code });
    }
  };

  const sendMessage = (toUserId, text) => {
    socketRef.current?.emit('teacher:message', { toUserId, text });
  };

  return { sendUpdate, students, sendMessage };
}