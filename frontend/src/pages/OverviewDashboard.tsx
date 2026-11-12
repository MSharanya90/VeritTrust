import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Bot,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FileCheck2,
  Workflow,
  ArrowRight,
  Flame,
  Radio,
  Lock,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { StatCard } from '../components/StatCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import { RiskBadge } from '../components/RiskBadge';
import { useWebSocket } from '../context/WebSocketContext';

export const OverviewDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, lastEvent } = useWebSocket();

  const [overview, setOverview] = useState<any>(null);
  const [threatMetrics, setThreatMetrics] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    try {
      const [ovData, tmData, agData] = await Promise.all([
        api.getOverview(),
        api.getThreatMetrics(),
        api.getAgents()
      ]);
      setOverview(ovData);
      setThreatMetrics(tmData);
      setAgents(agData);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Live WebSocket update trigger
  useEffect(() => {
    if (lastEvent) {
      fetchDashboardData();
    }
  }, [lastEvent]);

  if (loading) {
    return <LoadingSpinner message="Aggregating Cognitive Shield real-time telemetry..." />;
  }

  const COLORS = ['#10b981', '#f59e0b', '#f43f5e', '#ef4444'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Welcome / Live Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(56, 189, 248, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--electric-blue)'
          }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#fff' }}>
              Cognitive Shield Autonomous Protection Active
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Monitoring 5 autonomous agent workers across high-stakes financial, database, and customer channels.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => fetchDashboardData()}
            className="btn-veritrust-outline"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
          >
            <RefreshCw size={14} /> Refresh Telemetry
          </button>
          <button
            onClick={() => navigate('/orchestrator')}
            className="btn-veritrust-primary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
          >
            <Workflow size={14} /> Run Multi-Agent Pipeline
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          title="ACTIVE AI AGENTS"
          value={`${overview?.active_agents || 0} / ${overview?.total_agents || 0}`}
          subtitle="Agents guarded"
          icon={Bot}
          color="blue"
          trend="+1 provis. this week"
        />
        <StatCard
          title="HITL APPROVALS PENDING"
          value={overview?.pending_approvals || 0}
          subtitle={`Approval rate: ${overview?.approval_rate_percent || 100}%`}
          icon={CheckCircle2}
          color={overview?.pending_approvals > 0 ? 'amber' : 'emerald'}
          trend={overview?.pending_approvals > 0 ? 'Action Required' : 'Queue clear'}
          trendType={overview?.pending_approvals > 0 ? 'negative' : 'positive'}
        />
        <StatCard
          title="INJECTIONS NEUTRALIZED"
          value={overview?.injections_detected || 0}
          subtitle={`${overview?.total_detections || 0} total scans run`}
          icon={Flame}
          color="rose"
          trend="Shield blocked"
          trendType="neutral"
        />
        <StatCard
          title="AVERAGE FLEET TRUST"
          value={`${overview?.average_trust_score || 85}%`}
          subtitle="Dynamic reliability score"
          icon={TrendingUp}
          color="violet"
          trend="Optimal threshold >80%"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
        {/* Action Risk Levels Bar Chart */}
        <div className="veritrust-card">
          <div className="veritrust-card-header">
            <div className="veritrust-card-title">
              <AlertTriangle size={18} color="var(--electric-blue)" />
              Operations by Action Type & Average Risk
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Realtime Database Telemetry</span>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={threatMetrics?.actions_by_type || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="action" stroke="var(--text-muted)" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: 'var(--electric-blue)' }}
                />
                <Bar dataKey="count" name="Total Actions" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avg_risk" name="Avg Risk (0-100)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Distribution Pie */}
        <div className="veritrust-card">
          <div className="veritrust-card-header">
            <div className="veritrust-card-title">
              <ShieldAlert size={18} color="var(--rose-high)" />
              Incident Severity Breakdown
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{overview?.total_incidents || 0} Total</span>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={threatMetrics?.incidents_by_severity || [
                    { severity: 'LOW', count: 1 },
                    { severity: 'MEDIUM', count: 2 },
                    { severity: 'HIGH', count: 3 },
                    { severity: 'CRITICAL', count: 1 }
                  ]}
                  dataKey="count"
                  nameKey="severity"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={5}
                >
                  {(threatMetrics?.incidents_by_severity || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Guarded Agent Fleet Grid */}
      <div className="veritrust-card">
        <div className="veritrust-card-header">
          <div className="veritrust-card-title">
            <Bot size={18} color="var(--electric-blue)" />
            Autonomous Agent Fleet Status & Trust Standings
          </div>
          <button
            onClick={() => navigate('/agents')}
            className="btn-veritrust-outline"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          >
            View All Agents ({agents.length}) <ArrowRight size={13} />
          </button>
        </div>

        <div className="veritrust-table-wrapper">
          <table className="veritrust-table">
            <thead>
              <tr>
                <th>Agent Identifier</th>
                <th>Role Architecture</th>
                <th>Current Status</th>
                <th>Trust Score</th>
                <th>Tasks Guarded</th>
                <th>Threats Intercepted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{agent.name}</div>
                    <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {agent.code}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}>
                      {agent.role_type}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={agent.status} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '70px',
                        height: '6px',
                        borderRadius: '3px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${agent.current_trust_score}%`,
                          backgroundColor: agent.current_trust_score >= 80 ? 'var(--emerald-safe)' : agent.current_trust_score >= 60 ? 'var(--amber-warning)' : 'var(--crimson-critical)'
                        }} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{agent.current_trust_score}%</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{agent.tasks_count}</td>
                  <td>
                    <span style={{ color: agent.threat_count > 0 ? 'var(--rose-high)' : 'var(--text-muted)', fontWeight: 600 }}>
                      {agent.threat_count}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => navigate(`/agents`)}
                      className="btn-veritrust-outline"
                      style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                    >
                      Inspect Logs
                    </button>
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

