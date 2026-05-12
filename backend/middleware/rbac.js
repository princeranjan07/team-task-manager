const pool = require('../config/db');

const requireProjectAdmin = async (req, res, next) => {
  try {
    const project_id = req.params.project_id || req.params.id;
    if (!project_id) return res.status(400).json({ message: 'Project ID required' });

    const ownerResult = await pool.query(
      'SELECT owner_id FROM projects WHERE id = $1',
      [project_id]
    );
    if (!ownerResult.rows.length) return res.status(404).json({ message: 'Project not found' });

    if (ownerResult.rows[0].owner_id === req.user.id) return next();

    const memberResult = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [project_id, req.user.id]
    );
    if (memberResult.rows[0]?.role === 'admin') return next();

    res.status(403).json({ message: 'Admin access required for this action' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { requireProjectAdmin };
