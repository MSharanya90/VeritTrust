import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  ShieldAlert,
  FileText,
  RefreshCw,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { SecurityIncident } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const IncidentManagement: React.FC = () => {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('INVESTIGATING');
  const [notesText, setNotesText] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchIncidents = async () => {
    try {
      const data = await api.getIncidents();
      setIncidents(data);
      if (data.length > 0 && !selectedIncident) {
        setSelectedIncident(data[0]);
      }
    } catch (err) {
      console.error('Failed to load incidents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const openUpdateModal = (inc: SecurityIncident) => {
    setSelectedIncident(inc);
    setNewStatus(inc.status);
    setNotesText(inc.investigation_notes || '');
    setShowNotesModal(true);
  };

  const handleSaveIncidentUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    setSaving(true);
    try {
      await api.updateIncident(selectedIncident.id, {
        status: newStatus,
        investigation_notes: notesText
      });
      setShowNotesModal(false);
      fetchIncidents();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update incident');
    } finally {
      setSaving(false);
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    return statusFilter === 'ALL' || inc.status === statusFilter;
  });

  if (loading) {
    return <LoadingSpinner message="Loading active security incidents..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
            Security Incident Investigation & Remediation
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Track adversarial agent attempts, data exfiltration events, and prompt poisoning investigations.
          </p>
        </div>
        <button onClick={() => fetchIncidents()} className="btn-veritrust-outline" style={{ fontSize: '0.8rem' }}>
          <RefreshCw size={14} /> Refresh Incidents
        </button>
      </div>

      {/* Status Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {['ALL', 'OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'FALSE_POSITIVE'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            style={{
              background: statusFilter === st ? 'var(--blue-primary)' : 'var(--bg-surface)',
              color: statusFilter === st ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Incidents Table */}
      <div className="veritrust-card">
        <div className="veritrust-card-header">
          <div className="veritrust-card-title">
            <AlertTriangle size={18} color="var(--rose-high)" />
            Recorded Security Incidents ({filteredIncidents.length})
          </div>
        </div>

        <div className="veritrust-table-wrapper">
          <table className="veritrust-table">
            <thead>
              <tr>
                <th>Incident ID</th>
                <th>Title & Threat Synopsis</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Investigation Notes</th>
                <th>Timestamp</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map((inc) => (
                <tr key={inc.id}>
                  <td className="font-mono" style={{ color: 'var(--electric-blue)', fontWeight: 600 }}>
                    {inc.incident_number}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{inc.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {inc.description?.slice(0, 80)}...
                    </div>
                  </td>
                  <td>
                    <RiskBadge level={inc.severity} />
                  </td>
                  <td>
                    <StatusBadge status={inc.status} />
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '280px' }}>
                    {inc.investigation_notes || 'No investigation notes attached.'}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(inc.created_at).toLocaleString()}
                  </td>
                  <td>
                    <button
                      onClick={() => openUpdateModal(inc)}
                      className="btn-veritrust-primary"
                      style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Notes Modal */}
      {showNotesModal && selectedIncident && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="veritrust-card" style={{ width: '100%', maxWidth: '520px', backgroundColor: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                Update Incident {selectedIncident.incident_number}
              </h3>
              <button onClick={() => setShowNotesModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveIncidentUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Incident Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="form-veritrust-control"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="INVESTIGATING">INVESTIGATING</option>
                  <option value="CONTAINED">CONTAINED</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Investigation Notes & Remediation Steps
                </label>
                <textarea
                  rows={5}
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  className="form-veritrust-control"
                  style={{ fontSize: '0.85rem' }}
                  placeholder="Record findings, agent quarantine status, or rotated credentials..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowNotesModal(false)} className="btn-veritrust-outline">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-veritrust-primary">
                  {saving ? 'Saving...' : 'Save Incident State'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

