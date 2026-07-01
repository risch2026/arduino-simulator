const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Импорт роутов
const authRoutes = require('./src/routes/auth');
const lessonsRoutes = require('./src/routes/lessons');
const projectsRoutes = require('./src/routes/projects');

app.use('/api/auth', authRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/projects', projectsRoutes);

// WebSocket
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const students = new Map();
const classrooms = new Map();

io.on('connection', (socket) => {
  console.log('✅ Подключён:', socket.id);

  socket.on('student:join', (data) => {
    const { studentId, studentName, classroomId } = data;
    students.set(socket.id, { ...data, socketId: socket.id, code: '', running: false });
    
    if (!classrooms.has(classroomId)) classrooms.set(classroomId, []);
    classrooms.get(classroomId).push(socket.id);
    socket.join(classroomId);
    
    io.to('teacher:' + classroomId).emit('teacher:studentJoined', {
      studentId, studentName, socketId: socket.id
    });
  });

  socket.on('teacher:join', (data) => {
    const { classroomId, teacherId } = data;
    socket.join('teacher:' + classroomId);
    const classStudents = Array.from(students.values())
      .filter(s => s.classroomId === classroomId);
    socket.emit('teacher:studentsList', classStudents);
  });

  socket.on('student:codeUpdate', (data) => {
    const student = students.get(socket.id);
    if (student) {
      student.code = data.code;
      student.running = data.running || false;
      io.to('teacher:' + student.classroomId).emit('teacher:studentUpdate', {
        studentId: student.studentId,
        code: data.code,
        running: data.running
      });
    }
  });

  socket.on('teacher:runCode', (data) => {
    const { studentSocketId, code } = data;
    io.to(studentSocketId).emit('teacher:runCode', { code });
  });

  socket.on('teacher:message', (data) => {
    const { studentSocketId, message } = data;
    io.to(studentSocketId).emit('student:message', { message });
  });

  socket.on('disconnect', () => {
    const student = students.get(socket.id);
    if (student) {
      io.to('teacher:' + student.classroomId).emit('teacher:studentLeft', {
        studentId: student.studentId
      });
      students.delete(socket.id);
    }
  });
});

// API выполнения кода
app.post('/api/execute', (req, res) => {
  const { code } = req.body;
  if (!code) return res.json({ success: false, error: 'Код не предоставлен' });
  
  const errors = [];
  if (!code.includes('void setup()')) errors.push('Отсутствует setup()');
  if (!code.includes('void loop()')) errors.push('Отсутствует loop()');
  
  const openBraces = (code.match(/\{/g) || []).length;
  const closeBraces = (code.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) errors.push('Несбалансированные скобки');
  
  if (errors.length > 0) {
    return res.json({ success: false, error: errors.join('\n') });
  }
  
  res.json({
    success: true,
    output: 'Симуляция выполнена успешно',
    executionTime: Math.floor(Math.random() * 100) + 50
  });
});

const PORT = process.env.PORT || 4001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});