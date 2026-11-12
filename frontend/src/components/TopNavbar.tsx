import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Shield, LogOut, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';

export const TopNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Determine page title from pathname
  const getPageTitle = (path: string) => {
    switch (path) {
      case '/':
      case '/overview': return 'Overview Dashboard';
      case '/agents': return 'AI Agent Fleet Monitoring';
      case '/threats': return 'Prompt Injection & Threat Detection';
      case '/approvals': return 'Human-in-the-Loop Approval Center';
      case '/provenance': return 'Provenance & Source Lineage Explorer';
      case '/data-leakage': return 'Data Leakage & Sensitive Secret Monitor';
      case '/simulator': return 'Agent Operation Sandbox Simulator';
      case '/policies': return 'Security Policy Management Engine';
      case '/incidents': return 'Security Incident Investigation';
      case '/audit': return 'Immutable Audit Trail & Cryptographic Verification';
      case '/orchestrator': return 'Multi-Agent Security Orchestration';
      case '/trust-scores': return 'AI Agent Trust Score Analytics';
      case '/rag': return 'RAG Document & Retrieval Security Inspector';
      case '/playground': return 'Adversarial Security Testing Playground';
      case '/reports': return 'Security Analytics & Export Center';
      case '/notifications': return 'System Alerts & Notifications';
      case '/profile': return 'User Profile';
      case '/settings': return 'System Admin Settings';
      default: return 'VeriTrust Console';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    if (q.includes('agent')) navigate('/agents');
    else if (q.includes('threat') || q.includes('inject')) navigate('/threats');
    else if (q.includes('approv')) navigate('/approvals');
    else if (q.includes('prov') || q.includes('hash')) navigate('/provenance');
    else if (q.includes('leak') || q.includes('secret')) navigate('/data-leakage');
    else if (q.includes('policy')) navigate('/policies');
    else if (q.includes('incident')) navigate('/incidents');
    else if (q.includes('audit')) navigate('/audit');
    else if (q.includes('rag')) navigate('/rag');
    else if (q.includes('play')) navigate('/playground');
    else navigate('/overview');
  };

  return (
    <header style={{
      height: 'var(--topbar-height)',
      backgroundColor: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'fixed',
      top: 0,
      right: 0,
      left: 'var(--sidebar-width)',
      zIndex: 99,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem'
    }}>
      {/* Title & Breadcrumb */}
      <div>
        <h1 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          {getPageTitle(location.pathname)}
        </h1>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Environment: <span style={{ color: 'var(--electric-blue)' }}>Production Airgap Guard</span>
        </div>
      </div>

      {/* Center Search */}
      <form onSubmit={handleSearchSubmit} style={{ width: '320px', position: 'relative' }}>
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
        <input
          type="text"
          placeholder="Search agents, policies, hashes, threats... (Ctrl+K)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-veritrust-control"
          style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem', fontSize: '0.8rem', height: '36px' }}
        />
      </form>

      {/* Right User Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Realtime WS Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.75rem',
          color: isConnected ? 'var(--emerald-safe)' : 'var(--crimson-critical)',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '0.3rem 0.65rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isConnected ? 'var(--emerald-safe)' : 'var(--crimson-critical)',
            boxShadow: isConnected ? '0 0 8px var(--emerald-safe)' : 'none'
          }} />
          <span>{isConnected ? 'Telemetry Active' : 'Connecting'}</span>
        </div>

        {/* Notifications Icon */}
        <button
          onClick={() => navigate('/notifications')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            padding: '0.4rem'
          }}
          title="Security Notifications"
        >
          <Bell size={18} />
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: 'var(--rose-high)'
          }} />
        </button>

        {/* User Profile dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              color: 'var(--text-primary)'
            }}
          >
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: 'var(--blue-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#fff'
            }}>
              {user?.username ? user.username.slice(0, 2).toUpperCase() : 'AU'}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user?.username || 'Analyst'}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--electric-blue)', textTransform: 'capitalize' }}>
                {user?.role || 'analyst'}
              </div>
            </div>
          </button>

          {showProfileMenu && (
            <div style={{
              position: 'absolute',
              top: '42px',
              right: 0,
              width: '190px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              padding: '0.5rem 0',
              zIndex: 1000
            }}>
              <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{user?.full_name || user?.username}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
              <button
                onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                <UserIcon size={14} /> Profile Details
              </button>
              <button
                onClick={() => { setShowProfileMenu(false); logout(); navigate('/login'); }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  color: 'var(--crimson-critical)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  borderTop: '1px solid var(--border-subtle)'
                }}
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

