import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, User, Mail, ShieldCheck, AlertCircle, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleAuthModal } from '../components/GoogleAuthModal';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('analyst');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        email,
        username: username.trim() || undefined,
        full_name: fullName.trim() || undefined,
        password,
        role
      });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-primary)',
      padding: '2rem',
      position: 'relative'
    }}>
      {/* Background cyber ambient glow */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: '480px', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--blue-primary) 0%, var(--violet-accent) 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginBottom: '0.75rem'
          }}>
            <ShieldAlert size={26} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
            Create Your VeriTrust Account
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Register with your own credentials or continue with Google
          </p>
        </div>

        <div className="veritrust-card" style={{ padding: '2rem' }}>
          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--crimson-critical)',
              color: '#fca5a5',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={() => setIsGoogleModalOpen(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#ffffff',
              color: '#1f2937',
              border: '1px solid #e5e7eb',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'background-color 0.15s, transform 0.1s'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.27 21.46 7.37 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.1z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.27 2.54 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '1.25rem 0',
            gap: '0.75rem',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
            <span>or sign up with email</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-veritrust-control"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="email"
                  required
                  placeholder="your.email@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-veritrust-control"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Username (optional)
                </label>
                <input
                  type="text"
                  placeholder="auto-generated"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-veritrust-control"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Role Assignment
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="form-veritrust-control"
                >
                  <option value="analyst">Threat Analyst</option>
                  <option value="compliance_officer">Compliance Officer</option>
                  <option value="operator">Ops Operator</option>
                  <option value="admin">SecOps Admin</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Password (min. 6 characters)
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-veritrust-control"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-veritrust-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.35rem' }}
            >
              {loading ? 'Creating Account...' : 'Create Account & Sign In'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--electric-blue)', textDecoration: 'none', fontWeight: 600 }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Google SSO Modal */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSuccess={() => {
          setIsGoogleModalOpen(false);
          navigate('/');
        }}
      />
    </div>
  );
};
