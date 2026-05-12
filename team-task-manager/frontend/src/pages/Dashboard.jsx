import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FolderKanban, CheckSquare, Zap, AlertTriangle, ArrowRight } from 'lucide-react';

const PRIORITY_COLORS = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' };

export default function Dashboard() {
  const { user }            = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/projects'),
      api.get('/tasks/my'),
    ]).then(([pr, tr]) => {
      setProjects(pr.data);
      setTasks(tr.data);
    }).finally(() => setLoading(false));
  }, []);

  const now     = new Date();
  const overdue = tasks.filter((t) => t.due_date && new Date(t.due_date) < now && t.status !== 'done');
  const inProg  = tasks.filter((t) => t.status === 'in_progress');
  const done    = tasks.filter((t) => t.status === 'done');

  const stats = [
    { label: 'Total Projects', value: projects.length, icon: '📁', color: 'var(--accent)',  bg: 'var(--accent-bg)'  },
    { label: 'Assigned Tasks', value: tasks.length,    icon: '✅', color: 'var(--success)', bg: 'var(--success-bg)' },
    { label: 'In Progress',    value: inProg.length,   icon: '⚡', color: 'var(--warning)', bg: 'var(--warning-bg)' },
    { label: 'Overdue',        value: overdue.length,  icon: '🔥', color: 'var(--danger)',  bg: 'var(--danger-bg)'  },
  ];

  if (loading) return (
    <div className="full-loader">
      <span style={{ fontSize: '1.5rem' }}>⚡</span> Loading dashboard...
    </div>
  );

  return (
    <div className="page fade-in">
      {/* Header */}
      <div className="mb-lg">
        <h1 style={{ fontSize: '1.55rem' }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          <span style={{ color: 'var(--accent2)' }}>{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="page-subtitle">Here's your workspace overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-4 mb-lg" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.5rem' }}>
        {/* Recent Projects */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h2 style={{ fontSize: '1rem' }}>Recent Projects</h2>
            <Link to="/projects" style={{ fontSize: '0.8rem', color: 'var(--accent2)', display: 'flex', alignItems: 'center', gap: 3 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon">📁</div>
              <p>No projects yet.</p>
              <Link to="/projects" className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>
                Create your first project
              </Link>
            </div>
          ) : (
            projects.slice(0, 5).map((p) => {
              const total = Number(p.total_tasks) || 0;
              const comp  = Number(p.completed_tasks) || 0;
              const pct   = total ? Math.round((comp / total) * 100) : 0;
              return (
                <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card clickable mb-sm">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <strong style={{ fontSize: '0.92rem' }}>{p.title}</strong>
                        <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: 2 }}>by {p.owner_name}</div>
                      </div>
                      <span className={`badge badge-${p.status}`}>{p.status}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>
                      <span>{comp}/{total} tasks done</span>
                      <span style={{ color: pct === 100 ? 'var(--success)' : 'var(--text2)' }}>{pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    {p.due_date && (
                      <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: '0.4rem' }}>
                        📅 Due {new Date(p.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* My Tasks */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h2 style={{ fontSize: '1rem' }}>My Upcoming Tasks</h2>
            <Link to="/tasks" style={{ fontSize: '0.8rem', color: 'var(--accent2)', display: 'flex', alignItems: 'center', gap: 3 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {tasks.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon">🎉</div>
              <p>No tasks assigned to you!</p>
            </div>
          ) : (
            tasks.slice(0, 6).map((t) => {
              const isOverdue = t.due_date && new Date(t.due_date) < now && t.status !== 'done';
              return (
                <div key={t.id} className={`task-card ${isOverdue ? 'overdue-border' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {isOverdue && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                          <AlertTriangle size={11} color="var(--danger)" />
                          <span className="overdue-tag">Overdue</span>
                        </div>
                      )}
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: 3 }}>
                        📁 {t.project_title}
                        {t.due_date && ` · 📅 ${new Date(t.due_date).toLocaleDateString()}`}
                      </div>
                    </div>
                    <span className={`badge badge-${t.priority}`} style={{ flexShrink: 0 }}>{t.priority}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
