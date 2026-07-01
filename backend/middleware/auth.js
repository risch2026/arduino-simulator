const jwt = require('jsonwebtoken');
module.exports = (requiredRole) => (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Нет токена' });
  try {
    req.user = jwt.verify(token, 'SECRET');
    if (requiredRole && req.user.role !== requiredRole)
      return res.status(403).json({ error: 'Нет прав' });
    next();
  } catch { res.status(401).json({ error: 'Токен невалиден' }); }
};