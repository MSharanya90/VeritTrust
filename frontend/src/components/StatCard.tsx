import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'positive',
  color = 'blue',
}) => {
  const colorMap = {
    blue: { iconBg: 'rgba(56, 189, 248, 0.15)', iconColor: 'var(--electric-blue)', border: 'rgba(56, 189, 248, 0.2)' },
    emerald: { iconBg: 'rgba(16, 185, 129, 0.15)', iconColor: 'var(--emerald-safe)', border: 'rgba(16, 185, 129, 0.2)' },
    amber: { iconBg: 'rgba(245, 158, 11, 0.15)', iconColor: 'var(--amber-warning)', border: 'rgba(245, 158, 11, 0.2)' },
    rose: { iconBg: 'rgba(244, 63, 94, 0.15)', iconColor: 'var(--rose-high)', border: 'rgba(244, 63, 94, 0.2)' },
    violet: { iconBg: 'rgba(139, 92, 246, 0.15)', iconColor: 'var(--violet-accent)', border: 'rgba(139, 92, 246, 0.2)' },
  };

  const style = colorMap[color];

  return (
    <div className="veritrust-card" style={{ borderColor: style.border }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="metric-label">{title}</div>
          <div className="metric-value" style={{ marginTop: '0.4rem' }}>{value}</div>
          {subtitle && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              {subtitle}
            </div>
          )}
          {trend && (
            <div style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              marginTop: '0.35rem',
              color: trendType === 'positive' ? 'var(--emerald-safe)' : trendType === 'negative' ? 'var(--rose-high)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              {trend}
            </div>
          )}
        </div>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: style.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: style.iconColor
        }}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
};

