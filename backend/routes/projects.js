const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { requireProjectAdmin } = require('../middleware/rbac');

// GET /api/projects — all projects for current user
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.*,
        u.name AS owner_name,
        COUNT(DISTINCT t.id) AS total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) AS completed_tasks,
        COUNT(DISTINCT pm.id) AS member_count
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN tasks t ON t.project_id = p.id
      LEFT JOIN project_members pm ON pm.project_id = p.id
      WHERE p.owner_id = $1
         OR p.id IN (SELECT project_id FROM project_members WHERE user_id = $1)
      GROUP BY p.id, u.name
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects — create project
router.post('/', auth, async (req, res) => {
  const { title, description, due_date } = req.body;
  if (!title || !title.trim())
    return res.status(400).json({ message: 'Project title is required' });
  try {
    const proj = await pool.query(
      'INSERT INTO projects (title, description, owner_id, due_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [title.trim(), description || null, req.user.id, due_date || null]
    );
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [proj.rows[0].id, req.user.id, 'admin']
    );
    res.status(201).json(proj.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/projects/:id — single project
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.name AS owner_name,
        COUNT(DISTINCT t.id) AS total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) AS completed_tasks
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.id = $1
      GROUP BY p.id, u.name
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Project not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/projects/:project_id — update project (admin only)
router.put('/:project_id', auth, requireProjectAdmin, async (req, res) => {
  const { title, description, status, due_date } = req.body;
  try {
    const result = await pool.query(
      'UPDATE projects SET title = $1, description = $2, status = $3, due_date = $4 WHERE id = $5 RETURNING *',
      [title, description, status, due_date || null, req.params.project_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/projects/:project_id — delete project (admin only)
router.delete('/:project_id', auth, requireProjectAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.project_id]);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
