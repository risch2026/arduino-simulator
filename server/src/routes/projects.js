const express = require('express');
const { supabase } = require('../db');
const { authMiddleware } = require('../auth');

const router = express.Router();

// Получить проекты текущего пользователя
router.get('/', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', req.user.id)
    .order('updated_at', { ascending: false });
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Создать проект
router.post('/', authMiddleware, async (req, res) => {
  const { title, description, difficulty, components, code, status } = req.body;
  
  const { data, error } = await supabase
    .from('projects')
    .insert([{
      title, description, difficulty, components, code, status,
      user_id: req.user.id
    }])
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Обновить проект
router.put('/:id', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('projects')
    .update({ ...req.body, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Удалить проект
router.delete('/:id', authMiddleware, async (req, res) => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;