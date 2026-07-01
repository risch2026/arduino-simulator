const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const authMiddleware = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const db = new Database('app.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE, password TEXT, role TEXT DEFAULT 'student'
  );
  CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT, content TEXT, task TEXT, author_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, title TEXT, circuit_json TEXT, code TEXT,
    code_mode TEXT DEFAULT 'visual', updated_at DATETIME
  );
  
`);





// Регистрация
app.post('/api/register', async (req, res) => {
  const { username, password, role } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const r = db.prepare('INSERT INTO users (username, password, role) VALUES (?,?,?)')
      .run(username, hash, role || 'student');
    res.json({ id: r.lastInsertRowid, username, role });
  } catch (e) {
    res.status(400).json({ error: 'Пользователь существует' });
  }
});

// Вход
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: 'Неверные данные' });
  const token = jwt.sign({ id: user.id, role: user.role }, 'SECRET', { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

// Учебные материалы (GET — всем, POST/PUT/DELETE — только учителям)
app.get('/api/lessons', (req, res) => {
  res.json(db.prepare('SELECT * FROM lessons ORDER BY created_at DESC').all());
});

app.post('/api/lessons', authMiddleware('teacher'), (req, res) => {
  const { title, content, task } = req.body;
  const r = db.prepare('INSERT INTO lessons (title, content, task, author_id) VALUES (?,?,?,?)')
    .run(title, content, task, req.user.id);
  res.json({ id: r.lastInsertRowid });
});

app.put('/api/lessons/:id', authMiddleware('teacher'), (req, res) => {
  const { title, content, task } = req.body;
  db.prepare('UPDATE lessons SET title=?, content=?, task=? WHERE id=?')
    .run(title, content, task, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/lessons/:id', authMiddleware('teacher'), (req, res) => {
  db.prepare('DELETE FROM lessons WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// Сохранение проектов ученика
app.get('/api/projects', authMiddleware(), (req, res) => {
  res.json(db.prepare('SELECT * FROM projects WHERE user_id=?').all(req.user.id));
});

app.post('/api/projects', authMiddleware(), (req, res) => {
  const { title, circuit_json, code, code_mode } = req.body;
  db.prepare(`INSERT INTO projects (user_id, title, circuit_json, code, code_mode, updated_at)
    VALUES (?,?,?,?,?,datetime('now'))`).run(req.user.id, title, circuit_json, code, code_mode);
  res.json({ ok: true });
});


// // backend/server.js
// app.get('/api/lessons/:id/tests', (req, res) => {
//   res.json(db.prepare('SELECT * FROM lesson_tests WHERE lesson_id=?').all(req.params.id));
// });

// app.post('/api/lessons/:id/tests', authMiddleware('teacher'), (req, res) => {
//   const { name, spec_json, timeout_ms } = req.body;
//   const r = db.prepare('INSERT INTO lesson_tests (lesson_id, name, spec_json, timeout_ms) VALUES (?,?,?,?)')
//     .run(req.params.id, name, spec_json, timeout_ms || 5000);
//   res.json({ id: r.lastInsertRowid });
// });

// app.delete('/api/lessons/:id/tests/:tid', authMiddleware('teacher'), (req, res) => {
//   db.prepare('DELETE FROM lesson_tests WHERE id=?').run(req.params.tid);
//   res.json({ ok: true });
// });




app.listen(3001, () => console.log('API on :3001'));