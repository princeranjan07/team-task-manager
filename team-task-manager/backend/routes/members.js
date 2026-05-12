const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/members — all users except current (for inviting)
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id != $1 ORDER BY name',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/members/:project_id — members of a project
router.get('/:project_id', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pm.id, pm.user_id, pm.role, pm.joined_at, u.name, u.email
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1
      ORDER BY pm.joined_at ASC
    `, [req.params.project_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/members/:project_id — add member by email
router.post('/:project_id', auth, async (req, res) => {
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  try {
    const userResult = await pool.query(
      'SELECT id, name FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (!userResult.rows.length)
      return res.status(404).json({ message: 'No user found with that email' });

    const userId = userResult.rows[0].id;

    // Check if already a member
    const already = await pool.query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [req.params.project_id, userId]
    );
    if (already.rows.length)
      return res.status(400).json({ message: 'User is already a member of this project' });

    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [req.params.project_id, userId, role || 'member']
    );
    res.json({ message: `${userResult.rows[0].name} added to project` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/members/:project_id/:user_id — update member role
router.patch('/:project_id/:user_id', auth, async (req, res) => {
  const { role } = req.body;
  try {
    await pool.query(
      'UPDATE project_members SET role = $1 WHERE project_id = $2 AND user_id = $3',
      [role, req.params.project_id, req.params.user_id]
    );
    res.json({ message: 'Role updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/members/:project_id/:user_id — remove member
router.delete('/:project_id/:user_id', auth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [req.params.project_id, req.params.user_id]
    );
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
