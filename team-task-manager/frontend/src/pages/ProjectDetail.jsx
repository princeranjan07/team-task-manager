import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { Plus, UserPlus, Trash2, ArrowLeft, Users } from 'lucide-react';

const STATUSES = ['todo', 'in_progress', 'done'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const STATUS_COLORS = { todo: '#6b6b8a', in_progress: '#6366f1', done: '#10b981' };
const AVATAR_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject]         = useState(null);
  const [tasks, setTasks]             = useState([]);
  const [members, setMembers]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showTaskModal, setShowTaskModal]   = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [taskForm, setTaskForm]       = useState({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });
  const [memberEmail, setMemberEmail] = useState('');
  const [savingTask, setSavingTask]   = useState(false);
  const [savingMember, setSavingMember] = useState(false);

  const setTF = (k) => (e) => setTaskForm((f) => ({ ...f, [k]: e.target.value }));

  const load = () =>
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks/project/${id}`),
      api.get(`/members/${id}`),
    ]).then(([pr, tr, mr]) => {
      setProject(pr.data);
      setTasks(tr.data);
      setMembers(mr.data);
    }).finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  const createTask = async (e) => {
    e.preventDefault();
    setSavingTask(true);
    try {
      await api.post('/tasks', { ...taskForm, project_id: id });
      toast.success('Task created!');
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally { setSavingTask(false); }
  };

  const updateStatus = async (taskId, status) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status });
      setTasks((ts) => ts.map((t) => t.id === taskId ? { ...t, status } : t));
    } catch { toast.error('Could not update status'); }
  };

  const deleteTask = async (taskId, title) => {
    if (!window.confirm(`Delete task "${title}"?`)) return;
    await api.delete(`/tasks/${taskId}`);
    toast.success('Task deleted');
    load();
  };

  const addMember = async (e) => {
    e.preventDefault();
    setSavingMember(true);
    try {
      const { data } = await api.post(`/members/${id}`, { email: memberEmail.trim() });
      toast.success(data.message || 'Member added!');
      setMemberEmail('');
      setShowMemberModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'User not found');
    } finally { setSavingMember(false); }
  };

  const removeMember = async (userId, name) => {
    if (!window.confirm(`Remove ${name} from this project?`)) return;
    await api.delete(`/members/${id}/${userId}`);
    toast.success('Member removed');
    load();
  };

  if (loading) return (
    <div className="full-loader"><span style={{ fontSize: '1.5rem' }}>⚡</span> Loading project...</div>
  );
  if (!project) return (
    <div className="page"><p style={{ color: 'var(--muted)' }}>Project not found.</p></div>
  );

  const total = Number(project.total_tasks) || 0;
  const comp  = Number(project.completed_tasks) || 0;
  const pct   = total ? Math.round((comp / total) * 100) : 0;

  return (
    <div className="page fade-in">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--muted)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
          <ArrowLeft size={13} /> All Projects
        </Link>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 className="page-title">{project.title}</h1>
              <span className={`badge badge-${project.status}`}>{project.status}</span>
            </div>
            {project.description && (
              <p className="page-subtitle" style={{ marginTop: '0.35rem' }}>{project.description}</p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                {comp}/{total} tasks &nbsp;·&nbsp;
                <span style={{ color: pct === 100 ? 'var(--success)' : 'var(--text2)', fontWeight: 600 }}>{pct}% complete</span>
              </div>
              {project.due_date && (
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                  📅 Due {new Date(project.due_date).toLocaleDateString()}
                </div>
              )}
            </div>
            <div style={{ marginTop: '0.6rem', width: '220px' }}>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={() => setShowMemberModal(true)}>
              <UserPlus size={15} /> Add Member
            </button>
            <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
              <Plus size={15} /> Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Users size={14} color="var(--muted)" />
          <span className="section-title" style={{ margin: 0 }}>Team Members ({members.length})</span>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {members.map((m, i) => (
            <div key={m.id} className="member-chip">
              <div className="member-avatar" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] + '22', color: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                {m.name[0].toUpperCase()}
              </div>
              <span style={{ fontSize: '0.83rem' }}>{m.name}</span>
              <span className={`badge badge-${m.role}`} style={{ fontSize: '0.65rem' }}>{m.role}</span>
              <button
                onClick={() => removeMember(m.user_id, m.name)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0 2px', fontSize: '0.9rem', lineHeight: 1 }}
                title="Remove member"
              >×</button>
            </div>
          ))}
          {members.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No members yet.</p>}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban">
        {STATUSES.map((status) => {
          const col = tasks.filter((t) => t.status === status);
          return (
            <div key={status} className="kanban-col">
              <div className="kanban-col-header">
                <div className="kanban-col-title">
                  <span className="kanban-dot" style={{ background: STATUS_COLORS[status] }} />
                  <span style={{ color: STATUS_COLORS[status] }}>{STATUS_LABELS[status]}</span>
                </div>
                <span className="kanban-count">{col.length}</span>
              </div>

              {col.map((task) => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                return (
                  <div key={task.id} className={`task-card ${isOverdue ? 'overdue-border' : ''}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.45rem' }}>
                      <span style={{ fontWeight: 500, fontSize: '0.875rem', lineHeight: 1.4, flex: 1, marginRight: '0.5rem' }}>{task.title}</span>
                      <button
                        onClick={() => deleteTask(task.id, task.title)}
                        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '2px', flexShrink: 0, opacity: 0.6, transition: 'opacity 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {task.description && (
                      <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginBottom: '0.5rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {task.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      {isOverdue && <span className="overdue-tag">overdue</span>}
                      {task.assigned_to_name && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>→ {task.assigned_to_name}</span>
                      )}
                    </div>

                    {task.due_date && (
                      <div style={{ fontSize: '0.73rem', color: isOverdue ? 'var(--danger)' : 'var(--muted)', marginBottom: '0.5rem' }}>
                        📅 {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}

                    <select
                      value={task.status}
                      onChange={(e) => updateStatus(task.id, e.target.value)}
                      className="input"
                      style={{ fontSize: '0.78rem', padding: '0.3rem 0.5rem' }}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                );
              })}

              {col.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--muted)', fontSize: '0.82rem' }}>
                  No tasks here
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      {showTaskModal && (
        <Modal title="Create Task" onClose={() => setShowTaskModal(false)}>
          <form onSubmit={createTask}>
            <div className="form-group">
              <label className="label">Task Title *</label>
              <input className="input" placeholder="e.g. Design homepage mockup" value={taskForm.title} onChange={setTF('title')} required autoFocus />
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea className="input" rows={2} placeholder="Optional details..." value={taskForm.description} onChange={setTF('description')} />
            </div>
            <div className="form-group">
              <label className="label">Assign To</label>
              <select className="input" value={taskForm.assigned_to} onChange={setTF('assigned_to')}>
                <option value="">— Unassigned —</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="label">Priority</label>
                <select className="input" value={taskForm.priority} onChange={setTF('priority')}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Due Date</label>
                <input className="input" type="date" value={taskForm.due_date} onChange={setTF('due_date')} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowTaskModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={savingTask}>
                {savingTask ? 'Creating...' : <><Plus size={15} /> Create Task</>}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <Modal title="Add Team Member" onClose={() => setShowMemberModal(false)}>
          <form onSubmit={addMember}>
            <div className="form-group">
              <label className="label">Member's Email Address</label>
              <input
                className="input"
                type="email"
                placeholder="teammate@example.com"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>
              💡 The person must already have a TaskFlow account. They will be added as a <strong>member</strong> and can view and update tasks.
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowMemberModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={savingMember}>
                {savingMember ? 'Adding...' : <><UserPlus size={15} /> Add Member</>}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
