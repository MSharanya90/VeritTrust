import React, { useState } from 'react';
import { User as UserIcon, Lock, Mail, Shield, Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const UserProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(null);
    setErrorMsg(null);
    try {
      await api.updateProfile({
        full_name: fullName,
        email,
        current_password: currentPassword || undefined,
        new_password: newPassword || undefined
      });
      await refreshUser();
      setSavedMsg('Profile successfully updated.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>User Profile & Role Credentials</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Manage your analyst identity and role authentication keys.
        </p>
      </div>

      <div className="veritrust-card">
        {savedMsg && (
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--emerald-safe)', color: '#6ee7b7', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} /> {savedMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--crimson-critical)', color: '#fca5a5', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '1rem' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Username (Immutable)
            </label>
            <input
              type="text"
              disabled
              value={user?.username || ''}
              className="form-veritrust-control font-mono"
              style={{ opacity: 0.7 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Assigned Role
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                padding: '0.3rem 0.75rem',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--electric-blue)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase'
              }}>
                <Shield size={13} style={{ display: 'inline', marginRight: '4px' }} />
                {user?.role || 'analyst'}
              </span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="form-veritrust-control"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-veritrust-control"
            />
          </div>

          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginBottom: '0.75rem' }}>
              Update Security Password
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="form-veritrust-control"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-veritrust-control"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-veritrust-primary"
            style={{ justifyContent: 'center', marginTop: '0.5rem' }}
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

