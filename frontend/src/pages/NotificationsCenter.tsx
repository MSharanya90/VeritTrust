import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  Clock,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { NotificationItem } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const NotificationsCenter: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const fetchNotifs = async () => {
    try {
      const data = await api.getNotifications(50);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const filteredNotifs = notifications.filter((n) => {
    return filterSeverity === 'ALL' || n.severity === filterSeverity;
  });

  if (loading) {
    return <LoadingSpinner message="Checking system notification center..." />;
  }

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return <ShieldAlert size={18} color="var(--crimson-critical)" />;
      case 'WARNING': return <AlertTriangle size={18} color="var(--amber-warning)" />;
      default: return <Info size={18} color="var(--electric-blue)" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
            System Alerts & Security Notifications
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Real-time notifications for approval requests, critical incidents, and agent state transitions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => fetchNotifs()} className="btn-veritrust-outline" style={{ fontSize: '0.8rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleMarkAllRead} className="btn-veritrust-primary" style={{ fontSize: '0.8rem' }}>
            <CheckCheck size={16} /> Mark All as Read
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            style={{
              background: filterSeverity === sev ? 'var(--blue-primary)' : 'var(--bg-surface)',
              color: filterSeverity === sev ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="veritrust-card">
        <div className="veritrust-card-header">
          <div className="veritrust-card-title">
            <Bell size={18} color="var(--electric-blue)" />
            Alert Inbox ({filteredNotifs.length})
          </div>
        </div>

        {filteredNotifs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No notifications in this category.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredNotifs.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: '1rem',
                  backgroundColor: n.is_read ? 'var(--bg-surface)' : 'rgba(56, 189, 248, 0.07)',
                  border: `1px solid ${n.is_read ? 'var(--border-subtle)' : 'rgba(56, 189, 248, 0.3)'}`,
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                  <div style={{ marginTop: '2px' }}>{getSeverityIcon(n.severity)}</div>
                  <div>
                    <div style={{ fontWeight: n.is_read ? 500 : 700, fontSize: '0.9rem', color: '#fff' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={12} /> {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {n.link_url && (
                    <button
                      onClick={() => navigate(n.link_url!)}
                      className="btn-veritrust-outline"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                    >
                      Inspect <ExternalLink size={12} />
                    </button>
                  )}
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="btn-veritrust-outline"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

