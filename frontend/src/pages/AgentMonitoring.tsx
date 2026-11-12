import React, { useEffect, useState } from 'react';
import {
  Bot,
  Plus,
  Search,
  Filter,
  Activity,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  X,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { Agent } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { RiskBadge } from '../components/RiskBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const AgentMonitoring: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRole, setNewRole] = useState('EXECUTION');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchAgents = async () => {
    try {
      const data = await api.getAgents();
      setAgents(data);
      if (data.length > 0 && !selectedAgent) {
        setSelectedAgent(data[0]);
        loadActivities(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load agents', err);
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async (agentId: number) => {
    setLoadingActivities(true);
    try {
      const acts = await api.getAgentActivities(agentId);
      setActivities(acts);
    } catch (err) {
      console.error('Failed to load activities', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    loadActivities(agent.id);
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await api.createAgent({
        name: newName,
        code: newCode,
        description: newDescription,
        role_type: newRole as any,
        status: 'ACTIVE'
      });
      setShowCreateModal(false);
      setNewName('');
      setNewCode('');
      setNewDescription('');
      fetchAgents();
    } catch (err: any) {
      setCreateError(err.response?.data?.detail || 'Failed to create agent');
    } finally {
      setCreating(false);
    }
  };

  const filteredAgents = agents.filter((agent) => {
    const matchesStatus = statusFilter === 'ALL' || agent.status === statusFilter;
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          agent.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return <LoadingSpinner message="Scanning agent fleet telemetry..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>AI Agent Fleet Supervision</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Live status telemetry, calculated trust scores, and security intercept records.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => fetchAgents()}
            className="btn-veritrust-outline"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
          >
            <RefreshCw size={14} /> Refresh Fleet
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-veritrust-primary"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
          >
            <Plus size={16} /> Register AI Agent
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '0.75rem 1.25rem',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search agent by name or code (e.g. AGENT-FIN-01)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-veritrust-control"
            style={{ border: 'none', background: 'transparent', padding: '0.2rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status:</span>
          {['ALL', 'ACTIVE', 'UNDER_REVIEW', 'BLOCKED', 'IDLE'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                background: statusFilter === st ? 'var(--blue-primary)' : 'rgba(255, 255, 255, 0.04)',
                color: statusFilter === st ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Agent Cards, Right Selected Agent Activity Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        {/* Agent Cards Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredAgents.map((agent) => {
            const isSelected = selectedAgent?.id === agent.id;
            return (
              <div
                key={agent.id}
                onClick={() => handleSelectAgent(agent)}
                className="veritrust-card"
                style={{
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--electric-blue)' : 'var(--border-subtle)',
                  boxShadow: isSelected ? 'var(--shadow-glow-blue)' : 'none',
                  padding: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(56, 189, 248, 0.1)',
                      color: 'var(--electric-blue)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Bot size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1rem', color: '#fff' }}>{agent.name}</div>
                      <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {agent.code} • {agent.role_type}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={agent.status} />
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {agent.description || 'No description assigned.'}
                </p>

                {/* Trust bar & metrics */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '0.75rem'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Trust Score: </span>
                    <span style={{
                      fontWeight: 700,
                      color: agent.current_trust_score >= 80 ? 'var(--emerald-safe)' : agent.current_trust_score >= 60 ? 'var(--amber-warning)' : 'var(--crimson-critical)'
                    }}>
                      {agent.current_trust_score}%
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <span><strong style={{ color: '#fff' }}>{agent.tasks_count}</strong> tasks</span>
                    <span>
                      <strong style={{ color: agent.threat_count > 0 ? 'var(--rose-high)' : '#fff' }}>
                        {agent.threat_count}
                      </strong> threats
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Agent Realtime Activities Drawer */}
        <div className="veritrust-card" style={{ height: 'fit-content' }}>
          <div className="veritrust-card-header">
            <div className="veritrust-card-title">
              <Activity size={18} color="var(--electric-blue)" />
              {selectedAgent ? `${selectedAgent.name} Activities` : 'Select an Agent'}
            </div>
            {selectedAgent && <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{selectedAgent.code}</span>}
          </div>

          {loadingActivities ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading activities...</div>
          ) : activities.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No recorded action telemetry for this agent yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '550px', overflowY: 'auto' }}>
              {activities.map((act) => (
                <div key={act.action_id} style={{
                  padding: '0.85rem',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#fff' }}>{act.action_type}</span>
                    <RiskBadge level={act.risk_level} score={act.risk_score} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--electric-blue)', marginBottom: '0.25rem' }}>
                    Target: {act.target_resource}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>Status: <strong style={{ color: act.status === 'APPROVED' ? 'var(--emerald-safe)' : act.status === 'BLOCKED' ? 'var(--crimson-critical)' : 'var(--amber-warning)' }}>{act.status}</strong></span>
                    <span>{new Date(act.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Provision New Agent Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="veritrust-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Register New AI Agent</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div style={{ padding: '0.6rem 0.8rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--crimson-critical)', color: '#fca5a5', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateAgent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Agent Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Compliance Auditor Bot"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="form-veritrust-control"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Agent Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AGENT-AUDIT-04"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="form-veritrust-control"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Role Responsibility
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="form-veritrust-control"
                  >
                    <option value="EXECUTION">Execution Agent</option>
                    <option value="RESEARCH">Research Agent</option>
                    <option value="GUARDIAN">Guardian Agent</option>
                    <option value="PROVENANCE">Provenance Agent</option>
                    <option value="COMPLIANCE">Compliance Agent</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Description & Operational Scope
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the agent's target systems, APIs, or business functions..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="form-veritrust-control"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-veritrust-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-veritrust-primary"
                >
                  {creating ? 'Registering...' : 'Provision Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

