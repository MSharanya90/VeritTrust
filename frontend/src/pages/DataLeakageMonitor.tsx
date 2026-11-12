import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  Copy,
  Play,
  Sparkles,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { DataLeakageResult } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const DataLeakageMonitor: React.FC = () => {
  const [inputText, setInputText] = useState(
    'Server config payload: user="admin", password="ProductionSecret@9918", apiKey="sk-proj-982173abcdef992817263544", awsKey="AKIAIOSFODNN7EXAMPLE", contact="finance-support@company.com".'
  );
  const [maskResult, setMaskResult] = useState(true);
  const [result, setResult] = useState<DataLeakageResult | null>(null);
  const [scanning, setScanning] = useState(false);

  const sampleLeaks = [
    {
      title: 'API Tokens & Secrets (OpenAI & AWS)',
      text: 'Deploying worker to AWS using AKIAIOSFODNN7EXAMPLE and LLM access token sk-proj-a1b2c3d4e5f6g7h8i9j0.'
    },
    {
      title: 'Database Credentials with URI',
      text: 'Failed cluster reconnect: postgres://dbuser:SuperSecretPass123@prod-cluster.internal:5432/customers_db.'
    },
    {
      title: 'Customer PII (SSN, Phone, Email)',
      text: 'Identity verification payload: Johnathan Doe, email j.doe@corporate.net, SSN: 000-12-3456, phone: +1-555-019-2831.'
    },
    {
      title: 'Clean Sanitized Text',
      text: 'System heartbeat operational. All microservices in cluster region us-east-1 report nominal latency.'
    }
  ];

  const handleScan = async (txt = inputText) => {
    setScanning(true);
    try {
      const res = await api.scanLeakage(txt, maskResult);
      setResult(res);
    } catch (err) {
      console.error('Scan failed', err);
    } finally {
      setScanning(false);
    }
  };

  const handleSelectSample = (sample: typeof sampleLeaks[0]) => {
    setInputText(sample.text);
    handleScan(sample.text);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
          Data Leakage & Secret Redaction Monitor
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Real-time exfiltration defense scanning for API tokens, database URIs, passwords, credentials, and customer PII.
        </p>
      </div>

      {/* Preset Samples */}
      <div className="veritrust-card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
          PRE-LOADED LEAKAGE TEST SAMPLES:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {sampleLeaks.map((s) => (
            <button
              key={s.title}
              onClick={() => handleSelectSample(s)}
              className="btn-veritrust-outline"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              <Sparkles size={13} color="var(--electric-blue)" /> {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Scan Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.5rem' }}>
        {/* Left Input */}
        <div className="veritrust-card">
          <div className="veritrust-card-header">
            <div className="veritrust-card-title">
              <KeyRound size={18} color="var(--electric-blue)" />
              Raw Text / Log Stream Inspector
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={maskResult}
                  onChange={(e) => setMaskResult(e.target.checked)}
                />
                Apply Redaction
              </label>
              <button
                onClick={() => handleScan()}
                disabled={scanning}
                className="btn-veritrust-primary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              >
                <Play size={14} /> {scanning ? 'Scanning...' : 'Scan Secrets'}
              </button>
            </div>
          </div>

          <div>
            <textarea
              rows={8}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="form-veritrust-control font-mono"
              style={{ fontSize: '0.85rem', lineHeight: 1.6 }}
              placeholder="Paste raw agent prompt, API request, log, or response here..."
            />
          </div>
        </div>

        {/* Right Output & Redacted Result */}
        <div className="veritrust-card" style={{ borderColor: result?.has_leakage ? 'rgba(244, 63, 94, 0.4)' : 'var(--border-subtle)' }}>
          <div className="veritrust-card-header">
            <div className="veritrust-card-title">
              <ShieldAlert size={18} color={result?.has_leakage ? 'var(--rose-high)' : 'var(--emerald-safe)'} />
              Redaction Output & Leakage Rationale
            </div>
            {result && <RiskBadge level={result.risk_level} score={result.leak_count > 0 ? 85 : 10} />}
          </div>

          {!result ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Click <strong>Scan Secrets</strong> to detect sensitive PII, API keys, and connection credentials.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Leaked Artifact Count Badge */}
              <div style={{
                padding: '0.85rem 1rem',
                backgroundColor: result.has_leakage ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                border: `1px solid ${result.has_leakage ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                {result.has_leakage ? <AlertTriangle size={20} color="var(--rose-high)" /> : <ShieldCheck size={20} color="var(--emerald-safe)" />}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: result.has_leakage ? '#fca5a5' : '#6ee7b7' }}>
                    {result.has_leakage ? `LEAKAGE DETECTED: ${result.leak_count} Artifact(s) Intercepted` : 'CLEAN: No Confidential Data Detected'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {result.explanation}
                  </div>
                </div>
              </div>

              {/* Masked Output Preview */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  REDACTED & SANITIZED PAYLOAD
                </div>
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.825rem',
                  fontFamily: 'monospace',
                  color: 'var(--electric-blue)',
                  wordBreak: 'break-all'
                }}>
                  {result.masked_text}
                </div>
              </div>

              {/* Detected Entities List */}
              {result.entities.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    INTERCEPTED ENTITIES ({result.entities.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {result.entities.map((ent, idx) => (
                      <div key={idx} style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.78rem'
                      }}>
                        <span style={{ fontWeight: 600, color: '#fca5a5' }}>{ent.entity_type}</span>
                        <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{ent.masked_value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

