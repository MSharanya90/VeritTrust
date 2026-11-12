import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Database,
  Mail,
  Send,
  FileCode,
  DollarSign,
  Share2,
  Check,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { Agent } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const AgentSimulator: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<number>(1);
  const [actionType, setActionType] = useState('FINANCIAL_TRANSFER');
  const [targetResource, setTargetResource] = useState('Federal Reserve ACH / Acct 99182741');
  const [paramsJson, setParamsJson] = useState('{\n  "amount": 9500.0,\n  "currency": "USD",\n  "beneficiary": "Apex Infrastructure Inc",\n  "memo": "Server expansion invoice #9921"\n}');
  const [userPrompt, setUserPrompt] = useState('Please transfer nine thousand five hundred dollars to Apex Infrastructure.');
  
  const [simResult, setSimResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const data = await api.getAgents();
        setAgents(data);
        if (data.length > 0) setSelectedAgentId(data[0].id);
      } catch (err) {
        console.error('Failed to load agents', err);
      } finally {
        setLoading(false);
      }
    };
    loadAgents();
  }, []);

  const actionPresets: Record<string, { target: string; payload: string; prompt: string }> = {
    FINANCIAL_TRANSFER: {
      target: 'Federal Reserve ACH / Acct 99182741',
      payload: '{\n  "amount": 9500.0,\n  "currency": "USD",\n  "beneficiary": "Apex Infrastructure Inc",\n  "memo": "Server expansion invoice #9921"\n}',
      prompt: 'Please transfer nine thousand five hundred dollars to Apex Infrastructure.'
    },
    DATABASE_MODIFICATION: {
      target: 'prod-customer-db.internal:5432 / public.users',
      payload: '{\n  "query": "DROP TABLE legacy_user_tokens CASCADE;"\n}',
      prompt: 'Clean up the legacy tokens table on production database.'
    },
    DATABASE_QUERY: {
      target: 'prod-customer-db.internal:5432 / analytics.metrics',
      payload: '{\n  "query": "SELECT COUNT(*) FROM daily_logins WHERE date = CURRENT_DATE;"\n}',
      prompt: 'Count today\'s active logins.'
    },
    SEND_EMAIL: {
      target: 'external-client@investor-partners.com',
      payload: '{\n  "subject": "Quarterly Financial Outlook",\n  "body": "Here is our internal forecast: Q3 profit is $4.2M."\n}',
      prompt: 'Draft and email quarterly financial performance to external partner.'
    },
    FILE_SYSTEM_WRITE: {
      target: '/etc/nginx/conf.d/gateway.conf',
      payload: '{\n  "path": "/etc/nginx/conf.d/gateway.conf",\n  "content": "server { listen 80; proxy_pass http://localhost:8000; }"\n}',
      prompt: 'Update gateway configuration to proxy port 8000.'
    }
  };

  const handleSelectActionType = (type: string) => {
    setActionType(type);
    if (actionPresets[type]) {
      setTargetResource(actionPresets[type].target);
      setParamsJson(actionPresets[type].payload);
      setUserPrompt(actionPresets[type].prompt);
    }
  };

  const handleRunSimulation = async () => {
    setSimulating(true);
    try {
      let parsedParams = {};
      try {
        parsedParams = JSON.parse(paramsJson);
      } catch {
        parsedParams = { raw: paramsJson };
      }

      const res = await api.simulateAction({
        agent_id: selectedAgentId,
        action_type: actionType,
        target_resource: targetResource,
        parameters: parsedParams,
        user_prompt: userPrompt
      });
      setSimResult(res);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Configuring agent sandbox..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
          Agent Operation Sandbox Simulator
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Safely test high-stakes agent operations against the Cognitive Shield with zero destructive side-effects.
        </p>
      </div>

      {/* Preset Action Buttons */}
      <div className="veritrust-card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
          CHOOSE ACTION TEMPLATE TO SIMULATE:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          {[
            { id: 'FINANCIAL_TRANSFER', label: 'Financial Transfer ($9,500)', icon: DollarSign },
            { id: 'DATABASE_MODIFICATION', label: 'Database Drop Table', icon: Database },
            { id: 'DATABASE_QUERY', label: 'Safe DB Query', icon: Database },
            { id: 'SEND_EMAIL', label: 'Outbound Client Email', icon: Mail },
            { id: 'FILE_SYSTEM_WRITE', label: 'System File Write', icon: FileCode },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = actionType === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectActionType(item.id)}
                className={isSelected ? 'btn-veritrust-primary' : 'btn-veritrust-outline'}
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
              >
                <Icon size={14} /> {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Workspace Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        {/* Left Inputs */}
        <div className="veritrust-card">
          <div className="veritrust-card-header">
            <div className="veritrust-card-title">
              <Terminal size={18} color="var(--electric-blue)" />
              Simulation Parameter Configuration
            </div>
            <button
              onClick={handleRunSimulation}
              disabled={simulating}
              className="btn-veritrust-primary"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
            >
              <Play size={14} /> {simulating ? 'Evaluating...' : 'Simulate in Sandbox'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Simulated AI Agent
                </label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(Number(e.target.value))}
                  className="form-veritrust-control"
                >
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name} ({ag.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Target Resource
                </label>
                <input
                  type="text"
                  value={targetResource}
                  onChange={(e) => setTargetResource(e.target.value)}
                  className="form-veritrust-control font-mono"
                  style={{ fontSize: '0.8rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                User Prompt Triggering Action
              </label>
              <input
                type="text"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="form-veritrust-control"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Proposed Operation Payload (JSON)
              </label>
              <textarea
                rows={6}
                value={paramsJson}
                onChange={(e) => setParamsJson(e.target.value)}
                className="form-veritrust-control font-mono"
                style={{ fontSize: '0.8rem', lineHeight: 1.5 }}
              />
            </div>
          </div>
        </div>

        {/* Right Simulation Report */}
        <div className="veritrust-card">
          <div className="veritrust-card-header">
            <div className="veritrust-card-title">
              <ShieldAlert size={18} color="var(--electric-blue)" />
              Simulation Safety Assessment
            </div>
            {simResult && (
              <RiskBadge
                level={simResult.risk_assessment.risk_level}
                score={simResult.risk_assessment.overall_risk_score}
              />
            )}
          </div>

          {!simResult ? (
            <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Click <strong>Simulate in Sandbox</strong> to calculate multi-factor risk scores and check pre-execution safety gates.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Outcome Banner */}
              <div style={{
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: simResult.approval_required ? 'rgba(245, 158, 11, 0.12)' : simResult.allowed_to_proceed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${simResult.approval_required ? 'rgba(245, 158, 11, 0.3)' : simResult.allowed_to_proceed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                  Verdict: {simResult.safety_verdict}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  {simResult.simulated_outcome}
                </div>
              </div>

              {/* Pre-Execution Security Checks Checklist */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  PRE-EXECUTION DEFENSE CHECKLIST
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {Object.entries(simResult.pre_execution_checks).map(([key, passed]: [string, any]) => (
                    <div key={key} style={{
                      padding: '0.45rem 0.75rem',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem'
                    }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{key.replace(/_/g, ' ')}</span>
                      {passed ? (
                        <span style={{ color: 'var(--emerald-safe)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                          <Check size={14} /> PASSED
                        </span>
                      ) : (
                        <span style={{ color: 'var(--rose-high)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                          <X size={14} /> FAILED
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Explainable Rationale */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  EXPLAINABLE AI RISK ANALYSIS
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {simResult.risk_assessment.explanation}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

