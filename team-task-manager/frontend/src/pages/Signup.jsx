import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Zap, User, Mail, Lock, UserPlus } from 'lucide-react';

export default function Signup() {
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { signup }            = useAuth();
  const navigate              = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signup(form.name.trim(), form.email.trim(), form.password);
      toast.success('Account created! Welcome 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box fade-in">
        <div className="auth-logo">
          <Zap size={22} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
          TaskFlow
        </div>
        <p className="auth-sub">Create your free workspace</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">
              <User size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
              Full Name
            </label>
            <input
              className="input"
              placeholder="John Doe"
              value={form.name}
              onChange={set('name')}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="label">
              <Mail size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
              Email Address
            </label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="label">
              <Lock size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
              Password
            </label>
            <input
              className="input"
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={set('password')}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.95rem' }}
          >
            {loading ? (
              <>
                <span className="spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', display: 'inline-block' }} />
                Creating account...
              </>
            ) : (
              <><UserPlus size={16} /> Create Account</>
            )}
          </button>
        </form>

        <p className="auth-divider">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
