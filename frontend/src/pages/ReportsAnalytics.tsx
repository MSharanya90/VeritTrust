import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const ReportsAnalytics: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [threatMetrics, setThreatMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7D');

  const fetchReportsData = async () => {
    try {
      const [ov, tm] = await Promise.all([
        api.getOverview(),
        api.getThreatMetrics()
      ]);
      setOverview(ov);
      setThreatMetrics(tm);
    } catch (err) {
      console.error('Failed to load reports data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  const handleDownloadCsv = (type: string) => {
    const url = api.getExportUrl(type, 'csv');
    window.open(url, '_blank');
  };

  if (loading) {
    return <LoadingSpinner message="Synthesizing security compliance reports..." />;
  }

  // Trend mock series for chart
  const weeklyTrends = [
    { day: 'Mon', executions: 42, threats: 3, approvals: 5 },
    { day: 'Tue', executions: 58, threats: 6, approvals: 8 },
    { day: 'Wed', executions: 65, threats: 2, approvals: 4 },
    { day: 'Thu', executions: 71, threats: 8, approvals: 12 },
    { day: 'Fri', executions: 84, threats: 4, approvals: 9 },
    { day: 'Sat', executions: 35, threats: 1, approvals: 3 },
    { day: 'Sun', executions: 40, threats: 2, approvals: 4 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
            Security Compliance & Telemetry Reports
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Comprehensive analytics, threat frequencies, and downloadable CSV compliance ledgers.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--bg-surface)', padding: '0.2rem', borderRadius: 'var(--radius-sm)' }}>
            {['24H', '7D', '30D', 'ALL'].map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                style={{
                  background: dateRange === r ? 'var(--blue-primary)' : 'transparent',
                  color: dateRange === r ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {r}
              </button>
            ))}
          </div>

          <button onClick={fetchReportsData} className="btn-veritrust-outline" style={{ fontSize: '0.8rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* CSV Export Bar */}
      <div className="veritrust-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
              One-Click Compliance CSV Export
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Download cryptographically verifiable datasets for SOC-2, ISO-42001, and HIPAA audits.
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            <button
              onClick={() => handleDownloadCsv('actions')}
              className="btn-veritrust-primary"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
            >
              <Download size={14} /> Actions Log (.CSV)
            </button>
            <button
              onClick={() => handleDownloadCsv('incidents')}
              className="btn-veritrust-outline"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
            >
              <FileSpreadsheet size={14} color="var(--rose-high)" /> Incidents (.CSV)
            </button>
            <button
              onClick={() => handleDownloadCsv('audit')}
              className="btn-veritrust-outline"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
            >
              <FileSpreadsheet size={14} color="var(--emerald-safe)" /> Hash Ledger (.CSV)
            </button>
            <button
              onClick={() => handleDownloadCsv('agents')}
              className="btn-veritrust-outline"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
            >
              <FileSpreadsheet size={14} color="var(--violet-accent)" /> Fleet Standings (.CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem' }}>
        {/* Weekly Activity Area Chart */}
        <div className="veritrust-card">
          <div className="veritrust-card-header">
            <div className="veritrust-card-title">
              <TrendingUp size={18} color="var(--electric-blue)" />
              Agent Workflow Volume & Threat Events
            </div>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrends} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorExec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorThreat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderRadius: '8px', color: '#fff' }} />
                <Area type="monotone" dataKey="executions" name="Executions" stroke="#38bdf8" fillOpacity={1} fill="url(#colorExec)" />
                <Area type="monotone" dataKey="threats" name="Threat Intercepts" stroke="#ef4444" fillOpacity={1} fill="url(#colorThreat)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Bar Chart */}
        <div className="veritrust-card">
          <div className="veritrust-card-header">
            <div className="veritrust-card-title">
              <ShieldAlert size={18} color="var(--rose-high)" />
              Action Risk Tier Distribution
            </div>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={threatMetrics?.actions_by_risk_level || [
                { level: 'LOW', count: 12 },
                { level: 'MEDIUM', count: 5 },
                { level: 'HIGH', count: 4 },
                { level: 'CRITICAL', count: 2 }
              ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="level" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="count" name="Operations Count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

