const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { supabase } = require('./db');

// Регистрация
async function register(email, username, password, role = 'student') {
  const password_hash = await bcrypt.hash(password, 10);
  
  const { data, error } = await supabase
    .from('users')
    .insert([{ email, username, password_hash, role }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Вход
async function login(email, password) {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error || !user) throw new Error('Пользователь не найден');
  
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error('Неверный пароль');
  
  // Обновляем last_login
  await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', user.id);
  
  const token = jwt.sign(
    { id: user.id, role: user.role, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  return { user: { id: user.id, username: user.username, role: user.role }, token };
}

// Middleware для проверки токена
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Не авторизован' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Недействительный токен' });
  }
}

// Middleware для учителя
function teacherOnly(req, res, next) {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Только для учителей' });
  }
  next();
}

module.exports = { register, login, authMiddleware, teacherOnly };