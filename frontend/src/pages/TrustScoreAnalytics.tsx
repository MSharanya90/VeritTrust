import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Info,
  ShieldAlert,
  Bot
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';

export const TrustScoreAnalytics: React.FC = () => {
  const [agentAnalytics, setAgentAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const data = await api.getAgentAnalytics();
      setAgentAnalytics(data);
    } catch (err) {
      console.error('Failed to load trust analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Calculating dynamic agent trust scores..." />;
  }

  // Build chart timeline data
  const chartData = [
    { period: 'Day -14', 'FIN-SENTINEL-01': 85, 'DB-MIGRATOR-02': 80, 'SUPPORT-BOT-03': 90 },
    { period: 'Day -10', 'FIN-SENTINEL-01': 88, 'DB-MIGRATOR-02': 75, 'SUPPORT-BOT-03': 92 },
    { period: 'Day -7', 'FIN-SENTINEL-01': 90, 'DB-MIGRATOR-02': 64, 'SUPPORT-BOT-03': 94 },
    { period: 'Day -3', 'FIN-SENTINEL-01': 91, 'DB-MIGRATOR-02': 58, 'SUPPORT-BOT-03': 95 },
    { period: 'Current', 'FIN-SENTINEL-01': 92.5, 'DB-MIGRATOR-02': 58, 'SUPPORT-BOT-03': 95 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
            Dynamic Agent Trust Score Analytics
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Multi-factor behavioral scoring based on policy adherence, prompt safety, and human reviewer decisions.
          </p>
        </div>
        <button onClick={fetchData} className="btn-veritrust-outline" style={{ fontSize: '0.8rem' }}>
          <RefreshCw size={14} /> Refresh Standings
        </button>
      </div>

      {/* Trust vs Hard Verification Disclaimer Banner */}
      <div style={{
        padding: '0.85rem 1.25rem',
        backgroundColor: 'rgba(56, 189, 248, 0.08)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.8rem',
        color: 'var(--text-secondary)'
      }}>
        <Info size={20} color="var(--electric-blue)" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: '#fff' }}>Trust Score Classification Notice:</strong> Calculated trust scores reflect historical behavioral compliance (0-100) and must be distinguished from independently verified cryptographic proofs. Actions with risk ≥60 mandate human approval regardless of high agent trust score.
        </div>
      </div>

      {/* Trust Score Trend Chart */}
      <div className="veritrust-card">
        <div className="veritrust-card-header">
          <div className="veritrust-card-title">
            <TrendingUp size={18} color="var(--electric-blue)" />
            Historical Trust Score Trajectories (Past 14 Days)
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Baseline: 80% • Review Threshold: &lt;60%</span>
        </div>

        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: -10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="period" stroke="var(--text-muted)" fontSize={11} />
              <YAxis domain={[40, 100]} stroke="var(--text-muted)" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)' }} />
              <Line type="monotone" dataKey="FIN-SENTINEL-01" stroke="#38bdf8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="DB-MIGRATOR-02" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="SUPPORT-BOT-03" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Standings Table */}
      <div className="veritrust-card">
        <div className="veritrust-card-header">
          <div className="veritrust-card-title">
            <Bot size={18} color="var(--electric-blue)" />
            Agent Reliability Standings & Penalty Logs
          </div>
        </div>

        <div className="veritrust-table-wrapper">
          <table className="veritrust-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Classification</th>
                <th>Trust Standing</th>
                <th>Status</th>
                <th>Tasks Guarded</th>
                <th>Threat Events</th>
                <th>Recent Adjustment Reason</th>
              </tr>
            </thead>
            <tbody>
              {agentAnalytics.map((ag) => {
                const latestHistory = ag.history && ag.history.length > 0 ? ag.history[0] : null;
                return (
                  <tr key={ag.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ag.name}</div>
                      <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ag.code}</div>
                    </td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: '4px',
                        fontSize: '0.72rem'
                      }}>
                        {ag.trust_score >= 80 ? 'Trusted Worker' : ag.trust_score >= 60 ? 'Monitored' : 'High Risk / Quarantine'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{
                          color: ag.trust_score >= 80 ? 'var(--emerald-safe)' : ag.trust_score >= 60 ? 'var(--amber-warning)' : 'var(--crimson-critical)',
                          fontSize: '0.95rem'
                        }}>
                          {ag.trust_score}%
                        </strong>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={ag.status} />
                    </td>
                    <td>{ag.tasks_count}</td>
                    <td>
                      <span style={{ color: ag.threat_count > 0 ? 'var(--rose-high)' : 'var(--text-muted)', fontWeight: 600 }}>
                        {ag.threat_count}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                      {latestHistory?.reason || 'Baseline enterprise provisioning'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

