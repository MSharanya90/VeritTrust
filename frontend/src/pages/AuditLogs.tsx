import React, { useEffect, useState } from 'react';
import {
  History,
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  RefreshCw,
  Lock,
  FileCheck2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { AuditLog, AuditVerificationResult } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<AuditVerificationResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    try {
      const data = await api.getAuditLogs(100);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleVerifyLedger = async () => {
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await api.verifyAuditLedger();
      setVerificationResult(res);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Audit verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const filteredLogs = logs.filter((l) => {
    return (
      l.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action_summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.actor_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.entry_hash.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (loading) {
    return <LoadingSpinner message="Validating cryptographic hash chain..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
            Tamper-Evident Immutable Audit Trail
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Cryptographically hash-chained append-only event ledger guaranteeing retrospective non-repudiation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => fetchLogs()} className="btn-veritrust-outline" style={{ fontSize: '0.8rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={handleVerifyLedger}
            disabled={verifying}
            className="btn-veritrust-primary"
            style={{ fontSize: '0.8rem', backgroundColor: '#059669' }}
          >
            <FileCheck2 size={16} /> {verifying ? 'Validating Hashes...' : 'Verify Cryptographic Chain'}
          </button>
        </div>
      </div>

      {/* Verification Result Banner */}
      {verificationResult && (
        <div style={{
          padding: '1.25rem',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: verificationResult.is_valid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${verificationResult.is_valid ? 'var(--emerald-safe)' : 'var(--crimson-critical)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          {verificationResult.is_valid ? (
            <ShieldCheck size={32} color="var(--emerald-safe)" />
          ) : (
            <ShieldAlert size={32} color="var(--crimson-critical)" />
          )}
          <div>
            <div style={{
              fontWeight: 700,
              fontSize: '1rem',
              color: verificationResult.is_valid ? '#6ee7b7' : '#fca5a5'
            }}>
              {verificationResult.is_valid ? 'CRYPTOGRAPHIC HASH INTEGRITY VERIFIED (0 TAMPERING DETECTED)' : 'INTEGRITY BREACH DETECTED'}
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              {verificationResult.message}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Verified: {verificationResult.verified_records} / {verificationResult.total_records} chained blocks intact.
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="veritrust-card">
        <div className="veritrust-card-header">
          <div className="veritrust-card-title">
            <Lock size={18} color="var(--electric-blue)" />
            Cryptographic Block Ledger ({filteredLogs.length})
          </div>
          <div style={{ width: '280px' }}>
            <input
              type="text"
              placeholder="Filter events, actors, hashes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-veritrust-control"
              style={{ fontSize: '0.75rem', height: '32px' }}
            />
          </div>
        </div>

        <div className="veritrust-table-wrapper">
          <table className="veritrust-table">
            <thead>
              <tr>
                <th>Block #</th>
                <th>Event Type</th>
                <th>Actor</th>
                <th>Target Resource</th>
                <th>Action Synopsis</th>
                <th>Previous Hash</th>
                <th>Entry SHA-256 Hash</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className="font-mono" style={{ fontWeight: 700, color: '#fff' }}>
                    #{log.id}
                  </td>
                  <td>
                    <span style={{
                      backgroundColor: 'rgba(56, 189, 248, 0.1)',
                      color: 'var(--electric-blue)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600
                    }}>
                      {log.event_type}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{log.actor_type}:</span> {log.actor_id}
                  </td>
                  <td>{log.resource_type} [{log.resource_id}]</td>
                  <td style={{ maxWidth: '280px', fontSize: '0.8rem' }}>
                    {log.action_summary}
                  </td>
                  <td className="font-mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {log.previous_hash.slice(0, 10)}...
                  </td>
                  <td className="font-mono" style={{ fontSize: '0.68rem', color: 'var(--emerald-safe)' }}>
                    {log.entry_hash.slice(0, 12)}...
                  </td>
                  <td style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

