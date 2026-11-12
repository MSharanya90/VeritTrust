import React, { useEffect, useState } from 'react';
import {
  Scale,
  Plus,
  Trash2,
  Edit2,
  Shield,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { SecurityPolicy } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const PolicyManagement: React.FC = () => {
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<SecurityPolicy | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('DATA_PROTECTION');
  const [severity, setSeverity] = useState('HIGH');
  const [description, setDescription] = useState('');
  const [riskPenalty, setRiskPenalty] = useState(30.0);
  const [enforcementMode, setEnforcementMode] = useState<'ENFORCE' | 'MONITOR_ONLY' | 'DISABLED'>('ENFORCE');
  const [rulesJson, setRulesJson] = useState('{\n  "restricted_operations": ["DOCUMENT_SHARE"]\n}');
  const [saving, setSaving] = useState(false);

  const fetchPolicies = async () => {
    try {
      const data = await api.getPolicies();
      setPolicies(data);
    } catch (err) {
      console.error('Failed to load policies', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const openCreateModal = () => {
    setEditingPolicy(null);
    setName('');
    setCode(`POL-${Date.now().toString().slice(-4)}`);
    setCategory('DATA_PROTECTION');
    setSeverity('HIGH');
    setDescription('');
    setRiskPenalty(30.0);
    setEnforcementMode('ENFORCE');
    setRulesJson('{\n  "restricted_operations": ["FINANCIAL_TRANSFER"]\n}');
    setShowModal(true);
  };

  const openEditModal = (pol: SecurityPolicy) => {
    setEditingPolicy(pol);
    setName(pol.name);
    setCode(pol.code);
    setCategory(pol.category);
    setSeverity(pol.severity);
    setDescription(pol.description || '');
    setRiskPenalty(pol.risk_penalty);
    setEnforcementMode(pol.enforcement_mode);
    setRulesJson(pol.rules_json || '{}');
    setShowModal(true);
  };

  const handleDeletePolicy = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this security policy?')) return;
    try {
      await api.deletePolicy(id);
      fetchPolicies();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete policy');
    }
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let parsedRules = rulesJson;
      try {
        parsedRules = JSON.parse(rulesJson);
      } catch {
        // Keep string if already formatted
      }

      if (editingPolicy) {
        await api.updatePolicy(editingPolicy.id, {
          name,
          category,
          severity: severity as any,
          description,
          risk_penalty: Number(riskPenalty),
          enforcement_mode: enforcementMode,
          rules_json: parsedRules
        });
      } else {
        await api.createPolicy({
          name,
          code,
          category,
          severity,
          description,
          risk_penalty: Number(riskPenalty),
          enforcement_mode: enforcementMode,
          rules_json: parsedRules,
          is_active: true
        });
      }
      setShowModal(false);
      fetchPolicies();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save policy');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Querying enterprise security policies..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
            Security Policy & Guardrail Configuration
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Configure operational boundaries, penalty scores, restricted API endpoints, and financial limits.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => fetchPolicies()} className="btn-veritrust-outline" style={{ fontSize: '0.8rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={openCreateModal} className="btn-veritrust-primary" style={{ fontSize: '0.8rem' }}>
            <Plus size={16} /> Create Policy
          </button>
        </div>
      </div>

      {/* Policy Table */}
      <div className="veritrust-card">
        <div className="veritrust-card-header">
          <div className="veritrust-card-title">
            <Scale size={18} color="var(--electric-blue)" />
            Active Enterprise Security Policies ({policies.length})
          </div>
        </div>

        <div className="veritrust-table-wrapper">
          <table className="veritrust-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Policy Name</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Penalty</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((pol) => (
                <tr key={pol.id}>
                  <td className="font-mono" style={{ color: 'var(--electric-blue)', fontWeight: 600 }}>
                    {pol.code}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{pol.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {pol.description?.slice(0, 70)}...
                    </div>
                  </td>
                  <td>
                    <span style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.72rem'
                    }}>
                      {pol.category}
                    </span>
                  </td>
                  <td>
                    <RiskBadge level={pol.severity} />
                  </td>
                  <td>
                    <strong style={{ color: 'var(--amber-warning)' }}>+{pol.risk_penalty} pts</strong>
                  </td>
                  <td>
                    <span style={{
                      fontSize: '0.75rem',
                      color: pol.enforcement_mode === 'ENFORCE' ? 'var(--emerald-safe)' : 'var(--text-muted)',
                      fontWeight: 600
                    }}>
                      {pol.enforcement_mode}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.75rem',
                      color: pol.is_active ? 'var(--emerald-safe)' : 'var(--text-muted)'
                    }}>
                      {pol.is_active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {pol.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => openEditModal(pol)}
                        className="btn-veritrust-outline"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                        title="Edit policy"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeletePolicy(pol.id)}
                        className="btn-veritrust-danger"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                        title="Delete policy"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Policy Modal */}
      {showModal && (
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
          <div className="veritrust-card" style={{ width: '100%', maxWidth: '580px', backgroundColor: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                {editingPolicy ? `Edit Policy ${editingPolicy.code}` : 'Author New Security Policy'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePolicy} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Policy Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-veritrust-control"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Code
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingPolicy}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="form-veritrust-control font-mono"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Category
                  </label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-veritrust-control">
                    <option value="DATA_PROTECTION">Data Protection</option>
                    <option value="FINANCIAL_CONTROLS">Financial Controls</option>
                    <option value="SYSTEM_OPERATIONS">System Operations</option>
                    <option value="PROMPT_SAFETY">Prompt Safety</option>
                    <option value="COMMUNICATION_RESTRICTION">Communication</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Severity
                  </label>
                  <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="form-veritrust-control">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Risk Penalty (pts)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={riskPenalty}
                    onChange={(e) => setRiskPenalty(Number(e.target.value))}
                    className="form-veritrust-control"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Policy Rationale / Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-veritrust-control"
                  placeholder="Explain why this rule exists..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Rule Criteria (JSON conditions)
                </label>
                <textarea
                  rows={4}
                  value={rulesJson}
                  onChange={(e) => setRulesJson(e.target.value)}
                  className="form-veritrust-control font-mono"
                  style={{ fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-veritrust-outline">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-veritrust-primary">
                  {saving ? 'Saving...' : editingPolicy ? 'Update Policy' : 'Save Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

