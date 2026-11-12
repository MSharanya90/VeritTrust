import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  Bot,
  Flame,
  CheckCircle2,
  GitBranch,
  KeyRound,
  FileSearch,
  Terminal,
  Scale,
  AlertTriangle,
  History,
  Workflow,
  TrendingUp,
  FlaskConical,
  BarChart3,
  Bell,
  User,
  Settings,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';

interface SidebarProps {
  pendingApprovalsCount?: number;
  unreadAlertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ pendingApprovalsCount = 1, unreadAlertsCount = 2 }) => {
  const { isConnected } = useWebSocket();

  const navGroups = [
    {
      title: 'CORE DEFENSE',
      items: [
        { name: 'Overview', to: '/', icon: LayoutDashboard },
        { name: 'Agent Monitoring', to: '/agents', icon: Bot },
        { name: 'Threat Detection', to: '/threats', icon: Flame },
        { name: 'Approval Center', to: '/approvals', icon: CheckCircle2, badge: pendingApprovalsCount },
      ],
    },
    {
      title: 'PROVENANCE & DATA',
      items: [
        { name: 'Provenance Explorer', to: '/provenance', icon: GitBranch },
        { name: 'Data Leakage', to: '/data-leakage', icon: KeyRound },
        { name: 'RAG Inspector', to: '/rag', icon: FileSearch },
      ],
    },
    {
      title: 'OPERATIONS & GOVERNANCE',
      items: [
        { name: 'Agent Simulator', to: '/simulator', icon: Terminal },
        { name: 'Policy Engine', to: '/policies', icon: Scale },
        { name: 'Incident Center', to: '/incidents', icon: AlertTriangle },
        { name: 'Audit Ledger', to: '/audit', icon: History },
      ],
    },
    {
      title: 'INTELLIGENCE & TESTING',
      items: [
        { name: 'Multi-Agent Pipeline', to: '/orchestrator', icon: Workflow },
        { name: 'Trust Scores', to: '/trust-scores', icon: TrendingUp },
        { name: 'Testing Playground', to: '/playground', icon: FlaskConical },
        { name: 'Reports & Export', to: '/reports', icon: BarChart3 },
        { name: 'Alerts & Notices', to: '/notifications', icon: Bell, badge: unreadAlertsCount },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { name: 'User Profile', to: '/profile', icon: User },
        { name: 'Admin Settings', to: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100,
      overflowY: 'auto'
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '1.25rem 1.25rem 1rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: 'var(--radius-sm)',
          background: 'linear-gradient(135deg, var(--blue-primary) 0%, var(--violet-accent) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 0 15px rgba(56, 189, 248, 0.35)'
        }}>
          <ShieldAlert size={22} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.15rem', letterSpacing: '-0.02em', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            VeriTrust <span style={{ fontSize: '0.65rem', background: 'rgba(56, 189, 248, 0.2)', color: 'var(--electric-blue)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>v1.0</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cognitive Shield & Provenance</div>
        </div>
      </div>

      {/* Live Status Pill */}
      <div style={{ padding: '0.75rem 1.25rem 0.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.45rem 0.75rem',
          backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Radio size={14} color={isConnected ? 'var(--emerald-safe)' : 'var(--crimson-critical)'} />
            <span style={{ fontWeight: 600, color: isConnected ? 'var(--emerald-safe)' : 'var(--crimson-critical)' }}>
              {isConnected ? 'SHIELD ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Realtime WS</span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav style={{ padding: '0.5rem 0.75rem', flex: 1 }}>
        {navGroups.map((group) => (
          <div key={group.title} style={{ marginBottom: '1.25rem' }}>
            <div style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              padding: '0.25rem 0.75rem',
              letterSpacing: '0.08em'
            }}>
              {group.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#fff' : 'var(--text-secondary)',
                      backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--electric-blue)' : '3px solid transparent',
                      textDecoration: 'none',
                      transition: 'all var(--transition-fast)'
                    })}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <Icon size={17} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span style={{
                        backgroundColor: 'var(--blue-primary)',
                        color: '#fff',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.45rem',
                        borderRadius: 'var(--radius-full)'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* System Footer info */}
      <div style={{
        padding: '0.75rem 1.25rem',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>High-Stakes HITL Guard</span>
        <ShieldCheck size={15} color="var(--electric-blue)" />
      </div>
    </aside>
  );
};

