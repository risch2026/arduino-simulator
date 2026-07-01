const express = require('express');
const { register, login } = require('../auth');

const router = express.Router();

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, role } = req.body;
    const user = await register(email, username, password, role);
    res.json({ success: true, user });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Вход
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json(result);
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

module.exports = router;