const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

function setupWS(httpServer, db) {
  const io = new Server(httpServer, { cors: { origin: '*' } });

  // Авторизация по токену
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    try {
      socket.user = jwt.verify(token, 'SECRET');
      next();
    } catch { next(new Error('Auth failed')); }
  });

  // Учитель подписывается на всех учеников
  io.on('connection', (socket) => {
    console.log(`[WS] ${socket.user.username} (${socket.user.role}) connected`);

    if (socket.user.role === 'student') {
      socket.join('students');
    } else {
      socket.join('teachers');
    }

    // Ученик отправляет снимок своей работы
    socket.on('student:update', (data) => {
      // data = { userId, username, circuit, code, timestamp }
      io.to('teachers').emit('student:update', {
        ...data,
        userId: socket.user.id,
        username: socket.user.username
      });
      // Сохраняем последний снимок в БД
      db.prepare(`
        INSERT OR REPLACE INTO live_sessions (user_id, circuit_json, code, updated_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(socket.user.id, JSON.stringify(data.circuit), data.code);
    });

    // Учитель отправляет сообщение конкретному ученику
    socket.on('teacher:message', ({ toUserId, text }) => {
      io.sockets.sockets.forEach(s => {
        if (s.user?.id === toUserId) {
          s.emit('teacher:message', { from: socket.user.username, text });
        }
      });
    });

    socket.on('disconnect', () => {
      if (socket.user.role === 'student') {
        io.to('teachers').emit('student:leave', { userId: socket.user.id });
      }
    });
  });
}

module.exports = { setupWS };