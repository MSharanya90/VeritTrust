import React, { useState } from 'react';
import { X, UserCheck, Mail, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { loginWithGoogle } = useAuth();
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectAccount = async (email: string, name: string) => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle({ email, name });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    await handleSelectAccount(customEmail, customName || customEmail.split('@')[0]);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 7, 15, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1.5rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '430px',
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24">
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
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>
                Sign in with Google
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                to continue to VeriTrust Security Platform
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#fca5a5',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          {!showCustom ? (
            <div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                Choose an account:
              </div>

              {/* Account 1 */}
              <div
                onClick={() => !loading && handleSelectAccount('alex.mercer@gmail.com', 'Alex Mercer')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid #1e293b',
                  backgroundColor: '#020617',
                  marginBottom: '0.6rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'border-color 0.15s, background-color 0.15s'
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: '#fff'
                }}>
                  AM
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>Alex Mercer</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    alex.mercer@gmail.com
                  </div>
                </div>
                <Shield size={16} color="#60a5fa" />
              </div>

              {/* Account 2 */}
              <div
                onClick={() => !loading && handleSelectAccount('sarah.chen.security@gmail.com', 'Sarah Chen')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid #1e293b',
                  backgroundColor: '#020617',
                  marginBottom: '0.6rem',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: '#fff'
                }}>
                  SC
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>Sarah Chen</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    sarah.chen.security@gmail.com
                  </div>
                </div>
                <Shield size={16} color="#a78bfa" />
              </div>

              {/* Option to type custom Google account */}
              <button
                type="button"
                onClick={() => setShowCustom(true)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px dashed #334155',
                  backgroundColor: 'transparent',
                  color: '#93c5fd',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  marginTop: '0.5rem'
                }}
              >
                <Mail size={16} />
                <span>Use another Google account</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Google Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: '#020617',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Display Name (optional)
                </label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: '#020617',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCustom(false)}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    backgroundColor: 'transparent',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 2,
                    padding: '0.65rem',
                    backgroundColor: '#2563eb',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {loading ? 'Authenticating...' : 'Sign In with Google'}
                  {!loading && <ArrowRight size={15} />}
                </button>
              </div>
            </form>
          )}

          <div style={{
            marginTop: '1.25rem',
            paddingTop: '0.9rem',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.725rem',
            color: '#64748b'
          }}>
            <UserCheck size={13} color="#10b981" />
            <span>Automatic provisioning & secure JWT token generation</span>
          </div>
        </div>
      </div>
    </div>
  );
};
