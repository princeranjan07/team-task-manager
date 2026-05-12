import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle, Circle, Clock } from 'lucide-react';

const STATUSES = { all: 'All', todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const STATUS_NEXT = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export default function Tasks() {
  const [tasks, setTasks]     = useState([]);
  const [filter, setFilter]   = useState('all');
  const [loading, setLoading] = useState(true);

  const load = () =>
    api.get('/tasks/my').then((r) => setTasks(r.data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const updateStatus = async (taskId, status) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status });
      setTasks((ts) => ts.map((t) => t.id === taskId ? { ...t, status } : t));
      toast.success(`Moved to ${STATUSES[status]}`);
    } catch { toast.error('Could not update status'); }
  };

  const now = new Date();
  const filtered = (filter === 'all' ? tasks : tasks.filter((t) => t.status === filter))
    .sort((a, b) => {
      if (a.status !== b.status) {
        const order = { in_progress: 0, todo: 1, done: 2 };
        return order[a.status] - order[b.status];
      }
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    });

  const counts = {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  if (loading) return (
    <div className="full-loader"><span style={{ fontSize: '1.5rem' }}>⚡</span> Loading tasks...</div>
  );

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {Object.entries(STATUSES).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="btn"
            style={{
              background: filter === key ? 'var(--accent-bg)' : 'var(--bg3)',
              color: filter === key ? 'var(--accent2)' : 'var(--text2)',
              border: `1px solid ${filter === key ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
              fontWeight: filter === key ? 600 : 400,
              fontSize: '0.84rem',
            }}
          >
            {label}
            <span style={{
              background: filter === key ? 'var(--accent)' : 'var(--bg2)',
              color: filter === key ? 'white' : 'var(--muted)',
              borderRadius: 999, padding: '0.05rem 0.45rem', fontSize: '0.7rem', fontWeight: 600,
            }}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state" style={{ padding: '4rem 2rem' }}>
          <div className="empty-state-icon">🎉</div>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.4rem' }}>
            {filter === 'all' ? 'No tasks assigned to you' : `No ${STATUSES[filter].toLowerCase()} tasks`}
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.87rem' }}>
            {filter === 'all' ? 'Tasks assigned to you in projects will appear here.' : 'Try a different filter.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {filtered.map((t) => {
            const isOverdue = t.due_date && new Date(t.due_date) < now && t.status !== 'done';
            const StatusIcon = t.status === 'done' ? CheckCircle : t.status === 'in_progress' ? Clock : Circle;
            const iconColor  = t.status === 'done' ? 'var(--success)' : t.status === 'in_progress' ? 'var(--accent2)' : 'var(--muted)';

            return (
              <div
                key={t.id}
                className={`card ${isOverdue ? 'overdue-border' : ''}`}
                style={{ padding: '1.1rem 1.25rem' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '1rem', alignItems: 'start' }}>
                  {/* Status icon */}
                  <button
                    onClick={() => updateStatus(t.id, STATUS_NEXT[t.status])}
                    title={`Move to ${STATUSES[STATUS_NEXT[t.status]]}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', marginTop: '2px' }}
                  >
                    <StatusIcon size={18} color={iconColor} />
                  </button>

                  {/* Content */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                      {isOverdue && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <AlertTriangle size={12} color="var(--danger)" />
                          <span className="overdue-tag">OVERDUE</span>
                        </div>
                      )}
                      <strong style={{ fontSize: '0.92rem', textDecoration: t.status === 'done' ? 'line-through' : 'none', color: t.status === 'done' ? 'var(--muted)' : 'var(--text)' }}>
                        {t.title}
                      </strong>
                      <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                      <span className={`badge badge-${t.status}`}>{STATUSES[t.status]}</span>
                    </div>
                    {t.description && (
                      <p style={{ fontSize: '0.83rem', color: 'var(--text2)', marginBottom: '0.35rem', lineHeight: 1.5 }}>{t.description}</p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.76rem', color: 'var(--muted)' }}>
                      <span>📁 {t.project_title}</span>
                      {t.due_date && (
                        <span style={{ color: isOverdue ? 'var(--danger)' : 'var(--muted)' }}>
                          📅 {new Date(t.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status selector */}
                  <select
                    value={t.status}
                    onChange={(e) => updateStatus(t.id, e.target.value)}
                    className="input"
                    style={{ width: 'auto', fontSize: '0.8rem', padding: '0.35rem 0.6rem', flexShrink: 0 }}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
