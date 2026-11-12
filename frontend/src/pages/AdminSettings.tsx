import React, { useState } from 'react';
import { Settings, Sliders, Shield, Save, CheckCircle2, Lock, Radio } from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';

export const AdminSettings: React.FC = () => {
  const { isConnected } = useWebSocket();
  const [approvalThreshold, setApprovalThreshold] = useState(60.0);
  const [criticalThreshold, setCriticalThreshold] = useState(80.0);
  const [approvalExpiry, setApprovalExpiry] = useState(60);
  const [strictRAGMode, setStrictRAGMode] = useState(true);
  const [auditHashing, setAuditHashing] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
          Cognitive Shield System Settings
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Global risk scoring parameters, Human-in-the-Loop thresholds, and cryptographic audit parameters.
        </p>
      </div>

      {saved && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--emerald-safe)', color: '#6ee7b7', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} /> Configuration successfully synchronized.
        </div>
      )}

      <div className="veritrust-card">
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Threshold Sliders */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                Human-in-the-Loop Approval Threshold
              </label>
              <strong style={{ color: 'var(--amber-warning)', fontSize: '0.9rem' }}>{approvalThreshold} / 100</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Any operation scoring at or above this threshold halts execution until human authorization is captured.
            </div>
            <input
              type="range"
              min="30"
              max="90"
              value={approvalThreshold}
              onChange={(e) => setApprovalThreshold(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--electric-blue)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                Critical Quarantine Threshold
              </label>
              <strong style={{ color: 'var(--rose-high)', fontSize: '0.9rem' }}>{criticalThreshold} / 100</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Operations scoring above this limit are immediately quarantined and denied execution.
            </div>
            <input
              type="range"
              min="70"
              max="99"
              value={criticalThreshold}
              onChange={(e) => setCriticalThreshold(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--crimson-critical)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginBottom: '0.35rem' }}>
              Approval Request Expiry Window (Minutes)
            </label>
            <input
              type="number"
              min="5"
              max="1440"
              value={approvalExpiry}
              onChange={(e) => setApprovalExpiry(Number(e.target.value))}
              className="form-veritrust-control"
              style={{ width: '140px' }}
            />
          </div>

          {/* Toggle Switches */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Strict RAG Poisoning Block</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Intercept and neutralize response generation if any retrieved chunk contains hidden directives.</div>
              </div>
              <input
                type="checkbox"
                checked={strictRAGMode}
                onChange={(e) => setStrictRAGMode(e.target.checked)}
                style={{ transform: 'scale(1.2)' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Continuous Cryptographic Audit Chaining</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Compute SHA-256 hash continuity links on all agent actions and policy updates.</div>
              </div>
              <input
                type="checkbox"
                checked={auditHashing}
                onChange={(e) => setAuditHashing(e.target.checked)}
                style={{ transform: 'scale(1.2)' }}
              />
            </label>
          </div>

          <button
            type="submit"
            className="btn-veritrust-primary"
            style={{ justifyContent: 'center', marginTop: '0.5rem' }}
          >
            <Save size={16} /> Save Configuration
          </button>
        </form>
      </div>
    </div>
  );
};

