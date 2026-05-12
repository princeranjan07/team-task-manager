const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/tasks/my — tasks assigned to current user
router.get('/my', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, p.title AS project_title, u.name AS assigned_to_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.assigned_to = $1
      ORDER BY
        CASE t.status WHEN 'todo' THEN 1 WHEN 'in_progress' THEN 2 WHEN 'done' THEN 3 END,
        t.due_date ASC NULLS LAST
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tasks/project/:project_id — tasks in a project
router.get('/project/:project_id', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, u.name AS assigned_to_name, c.name AS created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users c ON t.created_by = c.id
      WHERE t.project_id = $1
      ORDER BY t.created_at DESC
    `, [req.params.project_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tasks/dashboard — dashboard stats for current user
router.get('/dashboard', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE assigned_to = $1) AS my_tasks,
        COUNT(*) FILTER (WHERE assigned_to = $1 AND status = 'in_progress') AS in_progress,
        COUNT(*) FILTER (WHERE assigned_to = $1 AND status = 'done') AS done,
        COUNT(*) FILTER (WHERE assigned_to = $1 AND status != 'done' AND due_date < NOW()) AS overdue
      FROM tasks
    `, [req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks — create task
router.post('/', auth, async (req, res) => {
  const { title, description, project_id, assigned_to, priority, due_date } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ message: 'Task title is required' });
  if (!project_id) return res.status(400).json({ message: 'Project ID is required' });
  try {
    const result = await pool.query(
      `INSERT INTO tasks (title, description, project_id, assigned_to, created_by, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title.trim(), description || null, project_id, assigned_to || null, req.user.id, priority || 'medium', due_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/tasks/:id/status — update task status only
router.patch('/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['todo', 'in_progress', 'done'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ message: 'Invalid status' });
  try {
    const result = await pool.query(
      'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/tasks/:id — update full task
router.put('/:id', auth, async (req, res) => {
  const { title, description, assigned_to, priority, due_date, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE tasks
       SET title = $1, description = $2, assigned_to = $3, priority = $4, due_date = $5, status = $6
       WHERE id = $7 RETURNING *`,
      [title, description || null, assigned_to || null, priority, due_date || null, status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/tasks/:id — delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
