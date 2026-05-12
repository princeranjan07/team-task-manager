import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FolderKanban, CheckSquare,
  LogOut, ChevronDown, Zap,
} from 'lucide-react';
import { useState } from 'react';

const NAV_LINKS = [
  { to: '/',         label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
  { to: '/projects', label: 'Projects',  icon: <FolderKanban size={15} />    },
  { to: '/tasks',    label: 'My Tasks',  icon: <CheckSquare size={15} />     },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const { pathname }     = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      background: 'var(--bg2)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 200,
    }}>
      <div style={{
        maxWidth: 1240, margin: '0 auto', padding: '0 2.5rem',
        height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
            <span style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={15} color="var(--accent2)" fill="var(--accent2)" />
            </span>
            <span style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700, fontSize: '1rem', color: 'var(--text)',
            }}>
              Task<span style={{ color: 'var(--accent2)' }}>Flow</span>
            </span>
          </Link>

          {/* Nav links */}
          <div style={{ display: 'flex', gap: '0.15rem' }}>
            {NAV_LINKS.map(({ to, label, icon }) => {
              const active = pathname === to;
              return (
                <Link key={to} to={to} style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: 8,
                  fontSize: '0.855rem',
                  fontWeight: active ? 600 : 400,
                  textDecoration: 'none',
                  transition: 'all 0.18s',
                  background: active ? 'var(--accent-bg)' : 'transparent',
                  color: active ? 'var(--accent2)' : 'var(--text2)',
                  border: `1px solid ${active ? 'rgba(99,102,241,0.25)' : 'transparent'}`,
                }}>
                  {icon}{label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* User menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '0.4rem 0.75rem',
              cursor: 'pointer', color: 'var(--text)', fontSize: '0.855rem',
              transition: 'border-color 0.15s',
            }}
          >
            <span style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'var(--accent-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent2)',
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </span>
            <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </span>
            <span style={{
              fontSize: '0.65rem', background: 'var(--accent-bg)',
              color: 'var(--accent2)', padding: '0.1rem 0.4rem', borderRadius: 4, fontWeight: 600,
            }}>
              {user?.role}
            </span>
            <ChevronDown size={13} style={{ color: 'var(--muted)', transform: menuOpen ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
          </button>

          {menuOpen && (
            <>
              <div
                onClick={() => setMenuOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 1 }}
              />
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                background: 'var(--card)', border: '1px solid var(--border2)',
                borderRadius: 10, padding: '0.4rem', minWidth: 160, zIndex: 2,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                animation: 'slideUp 0.15s ease',
              }}>
                <div style={{
                  padding: '0.5rem 0.75rem 0.75rem',
                  borderBottom: '1px solid var(--border)',
                  marginBottom: '0.4rem',
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{user?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{user?.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 0.75rem', background: 'none', border: 'none',
                    color: 'var(--danger)', cursor: 'pointer', borderRadius: 7,
                    fontSize: '0.855rem', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
