import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, ShieldX } from 'lucide-react';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  level: RiskLevel | string;
  score?: number;
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, showIcon = true }) => {
  const normalizedLevel = level ? level.toUpperCase() : 'LOW';

  const config = {
    LOW: { className: 'badge-risk badge-risk-low', icon: ShieldCheck, label: 'LOW RISK' },
    MEDIUM: { className: 'badge-risk badge-risk-medium', icon: AlertTriangle, label: 'MEDIUM RISK' },
    HIGH: { className: 'badge-risk badge-risk-high', icon: ShieldAlert, label: 'HIGH RISK' },
    CRITICAL: { className: 'badge-risk badge-risk-critical', icon: ShieldX, label: 'CRITICAL' },
  }[normalizedLevel] || { className: 'badge-risk badge-risk-low', icon: ShieldCheck, label: normalizedLevel };

  const Icon = config.icon;

  return (
    <span className={config.className}>
      {showIcon && <Icon size={12} />}
      {config.label}
      {score !== undefined && ` (${score})`}
    </span>
  );
};

