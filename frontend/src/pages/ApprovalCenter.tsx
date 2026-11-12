import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Edit3,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  Send,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { ApprovalRequest } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const ApprovalCenter: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<ApprovalRequest | null>(null);
  const [notes, setNotes] = useState('');
  const [modifiedPayload, setModifiedPayload] = useState('');
  const [actionTypeDecision, setActionTypeDecision] = useState<'APPROVE' | 'REJECT' | 'MODIFY'>('APPROVE');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchApprovals = async () => {
    try {
      const data = await api.getApprovals();
      setApprovals(data);
    } catch (err) {
      console.error('Failed to load approvals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const openDecisionModal = (req: ApprovalRequest, decision: 'APPROVE' | 'REJECT' | 'MODIFY') => {
    setSelectedReq(req);
    setActionTypeDecision(decision);
    setNotes(decision === 'APPROVE' ? 'Approved after SecOps compliance verification.' : decision === 'REJECT' ? 'Operation denied: high financial/system risk.' : 'Parameters adjusted to safe limits.');
    setModifiedPayload(req.payload || '{}');
  };

  const handleExecuteDecision = async () => {
    if (!selectedReq) return;
    setSubmitting(true);
    try {
      if (actionTypeDecision === 'APPROVE') {
        await api.approveRequest(selectedReq.id, notes);
        setActionSuccessMsg(`Action #${selectedReq.action_id} authorized successfully! Simulated execution dispatched.`);
      } else if (actionTypeDecision === 'REJECT') {
        await api.rejectRequest(selectedReq.id, notes);
        setActionSuccessMsg(`Action #${selectedReq.action_id} rejected. Agent notified and quarantined.`);
      } else {
        await api.modifyRequest(selectedReq.id, modifiedPayload, notes);
        setActionSuccessMsg(`Action #${selectedReq.action_id} modified with safe parameters and dispatched.`);
      }
      setSelectedReq(null);
      fetchApprovals();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit approval decision');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Querying Human-in-the-Loop approval queue..." />;
  }

  const pendingList = approvals.filter((a) => a.status === 'PENDING');
  const resolvedList = approvals.filter((a) => a.status !== 'PENDING');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
            Human-in-the-Loop (HITL) Authorization Center
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Enforce mandatory human sign-off on autonomous operations exceeding enterprise risk threshold (≥60/100).
          </p>
        </div>
        <button
          onClick={() => fetchApprovals()}
          className="btn-veritrust-outline"
          style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
        >
          <RefreshCw size={14} /> Refresh Queue
        </button>
      </div>

      {actionSuccessMsg && (
        <div style={{
          padding: '0.85rem 1.25rem',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid var(--emerald-safe)',
          color: '#6ee7b7',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{actionSuccessMsg}</span>
          <button onClick={() => setActionSuccessMsg(null)} style={{ background: 'none', border: 'none', color: '#6ee7b7', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Pending Action Requests */}
      <div className="veritrust-card">
        <div className="veritrust-card-header">
          <div className="veritrust-card-title">
            <Clock size={18} color="var(--amber-warning)" />
            Pending Authorization Requests ({pendingList.length})
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-expires in 60m if unreviewed</span>
        </div>

        {pendingList.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <UserCheck size={36} color="var(--emerald-safe)" style={{ margin: '0 auto 0.75rem', opacity: 0.8 }} />
            <div>All high-risk operations have been authorized or reviewed. Queue is clear!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendingList.map((req) => (
              <div
                key={req.id}
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                        {req.action_type || 'PROPOSED ACTION'}
                      </span>
                      <RiskBadge level={req.risk_score >= 80 ? 'CRITICAL' : 'HIGH'} score={req.risk_score} />
                      <StatusBadge status={req.status} />
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Requested by <strong style={{ color: 'var(--electric-blue)' }}>{req.agent_name || `Agent #${req.requested_by_agent_id}`}</strong> • Target: {req.target_resource}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => openDecisionModal(req, 'APPROVE')}
                      className="btn-veritrust-primary"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', backgroundColor: '#059669' }}
                    >
                      <CheckCircle2 size={14} /> Authorize
                    </button>
                    <button
                      onClick={() => openDecisionModal(req, 'MODIFY')}
                      className="btn-veritrust-outline"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                    >
                      <Edit3 size={14} /> Modify
                    </button>
                    <button
                      onClick={() => openDecisionModal(req, 'REJECT')}
                      className="btn-veritrust-danger"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                    >
                      <XCircle size={14} /> Deny
                    </button>
                  </div>
                </div>

                {/* Payload snippet preview */}
                <div style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  border: '1px solid rgba(255,255,255,0.04)'
                }}>
                  {req.payload}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>Dispatched: {new Date(req.created_at).toLocaleString()}</span>
                  <span>Expires: {new Date(req.expires_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historical Resolved Approvals */}
      <div className="veritrust-card">
        <div className="veritrust-card-header">
          <div className="veritrust-card-title">
            <UserCheck size={18} color="var(--electric-blue)" />
            Authorization Decision Audit Log ({resolvedList.length})
          </div>
        </div>

        <div className="veritrust-table-wrapper">
          <table className="veritrust-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Target Resource</th>
                <th>Risk Score</th>
                <th>Verdict</th>
                <th>Reviewer Notes</th>
                <th>Resolved Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {resolvedList.map((item) => (
                <tr key={item.id}>
                  <td className="font-mono">#{item.id}</td>
                  <td style={{ fontWeight: 600 }}>{item.target_resource}</td>
                  <td>
                    <RiskBadge level={item.risk_score >= 80 ? 'CRITICAL' : item.risk_score >= 60 ? 'HIGH' : 'LOW'} score={item.risk_score} />
                  </td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {item.reviewer_notes || 'No review remarks attached.'}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {item.resolved_at ? new Date(item.resolved_at).toLocaleString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Review Modal */}
      {selectedReq && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="veritrust-card" style={{ width: '100%', maxWidth: '560px', backgroundColor: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                {actionTypeDecision === 'APPROVE' ? 'Authorize High-Stakes Action' : actionTypeDecision === 'REJECT' ? 'Deny and Quarantine Action' : 'Modify Payload Parameters'}
              </h3>
              <button onClick={() => setSelectedReq(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                padding: '0.75rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem'
              }}>
                <div><strong>Action Type:</strong> {selectedReq.action_type}</div>
                <div><strong>Target Resource:</strong> {selectedReq.target_resource}</div>
                <div><strong>Risk Score:</strong> {selectedReq.risk_score}/100</div>
              </div>

              {actionTypeDecision === 'MODIFY' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Adjust Payload JSON (Restricted fields / Safe amounts):
                  </label>
                  <textarea
                    rows={4}
                    value={modifiedPayload}
                    onChange={(e) => setModifiedPayload(e.target.value)}
                    className="form-veritrust-control font-mono"
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Reviewer Notes & Justification (Logged to Immutable Audit Trail)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-veritrust-control"
                  style={{ fontSize: '0.85rem' }}
                  placeholder="Record why this action is authorized or denied..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="btn-veritrust-outline"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDecision}
                  disabled={submitting}
                  className={actionTypeDecision === 'REJECT' ? 'btn-veritrust-danger' : 'btn-veritrust-primary'}
                >
                  {submitting ? 'Recording...' : `Confirm ${actionTypeDecision}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

