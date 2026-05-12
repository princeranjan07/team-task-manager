require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

const authRoutes    = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes    = require('./routes/tasks');
const memberRoutes  = require('./routes/members');

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    process.env.FRONTEND_URL || 'http://localhost:5173',
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks',    taskRoutes);
app.use('/api/members',  memberRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ─── Database Init ────────────────────────────────────────────────────────────
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(100)  NOT NULL,
        email      VARCHAR(150)  UNIQUE NOT NULL,
        password   VARCHAR(255)  NOT NULL,
        role       VARCHAR(20)   NOT NULL DEFAULT 'member',
        created_at TIMESTAMP     NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS projects (
        id          SERIAL PRIMARY KEY,
        title       VARCHAR(200)  NOT NULL,
        description TEXT,
        owner_id    INTEGER       REFERENCES users(id) ON DELETE CASCADE,
        status      VARCHAR(20)   NOT NULL DEFAULT 'active',
        due_date    DATE,
        created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS project_members (
        id         SERIAL PRIMARY KEY,
        project_id INTEGER   NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id    INTEGER   NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
        role       VARCHAR(20) NOT NULL DEFAULT 'member',
        joined_at  TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (project_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id          SERIAL PRIMARY KEY,
        title       VARCHAR(200) NOT NULL,
        description TEXT,
        project_id  INTEGER      NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        assigned_to INTEGER      REFERENCES users(id) ON DELETE SET NULL,
        created_by  INTEGER      REFERENCES users(id) ON DELETE SET NULL,
        status      VARCHAR(30)  NOT NULL DEFAULT 'todo',
        priority    VARCHAR(20)  NOT NULL DEFAULT 'medium',
        due_date    DATE,
        created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ Database tables ready');
  } catch (err) {
    console.error('❌ DB init failed:', err.message);
    process.exit(1);
  }
};

// ─── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
  });
});
