const express = require('express');
const { supabase } = require('../db');
const { authMiddleware, teacherOnly } = require('../auth');

const router = express.Router();

// Получить все уроки
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Получить урок по ID
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', req.params.id)
    .single();
  
  if (error) return res.status(404).json({ error: 'Не найден' });
  res.json(data);
});

// Создать урок (только учитель)
router.post('/', authMiddleware, teacherOnly, async (req, res) => {
  const { title, description, content, image_url, test_id, test_data } = req.body;
  
  const { data, error } = await supabase
    .from('lessons')
    .insert([{
      title, description, content, image_url, test_id, test_data,
      author_id: req.user.id
    }])
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Обновить урок (только учитель)
router.put('/:id', authMiddleware, teacherOnly, async (req, res) => {
  const { data, error } = await supabase
    .from('lessons')
    .update({ ...req.body, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Удалить урок (только учитель)
router.delete('/:id', authMiddleware, teacherOnly, async (req, res) => {
  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', req.params.id);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;