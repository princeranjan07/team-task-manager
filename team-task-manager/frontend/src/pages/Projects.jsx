import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { Plus, Trash2, Eye, FolderKanban } from 'lucide-react';

export default function Projects() {
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting]   = useState(null);
  const [form, setForm]           = useState({ title: '', description: '', due_date: '' });
  const [saving, setSaving]       = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const load = () =>
    api.get('/projects').then((r) => setProjects(r.data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/projects', form);
      toast.success('Project created!');
      setShowModal(false);
      setForm({ title: '', description: '', due_date: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This will also delete all tasks inside it.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      load();
    } catch {
      toast.error('Could not delete project');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return (
    <div className="full-loader"><span style={{ fontSize: '1.5rem' }}>⚡</span> Loading projects...</div>
  );

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} in your workspace</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card empty-state" style={{ padding: '4rem 2rem' }}>
          <div className="empty-state-icon">📁</div>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>No projects yet</h3>
          <p style={{ color: 'var(--muted)' }}>Create your first project to get started.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowModal(true)}>
            <Plus size={16} /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-2">
          {projects.map((p) => {
            const total = Number(p.total_tasks)     || 0;
            const comp  = Number(p.completed_tasks) || 0;
            const pct   = total ? Math.round((comp / total) * 100) : 0;
            return (
              <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '0.97rem', fontWeight: 600, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.title}
                    </h3>
                    <div style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>by {p.owner_name}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    <span className={`badge badge-${p.status}`}>{p.status}</span>
                  </div>
                </div>

                {p.description && (
                  <p style={{ fontSize: '0.83rem', color: 'var(--text2)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.description}
                  </p>
                )}

                {/* Progress */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>
                    <span>{comp}/{total} tasks</span>
                    <span style={{ color: pct === 100 ? 'var(--success)' : 'var(--text2)' }}>{pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>
                    👥 {Number(p.member_count) || 0} member{Number(p.member_count) !== 1 ? 's' : ''}
                    {p.due_date && ` · 📅 ${new Date(p.due_date).toLocaleDateString()}`}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <Link to={`/projects/${p.id}`} className="btn btn-ghost btn-sm">
                      <Eye size={13} /> Open
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id, p.title)}
                      className="btn btn-danger btn-sm"
                      disabled={deleting === p.id}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <Modal title="New Project" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="label">Project Title *</label>
              <input className="input" placeholder="e.g. Website Redesign" value={form.title} onChange={set('title')} required autoFocus />
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea className="input" rows={3} placeholder="What is this project about?" value={form.description} onChange={set('description')} />
            </div>
            <div className="form-group">
              <label className="label">Due Date</label>
              <input className="input" type="date" value={form.due_date} onChange={set('due_date')} />
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Creating...' : <><Plus size={15} /> Create Project</>}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
