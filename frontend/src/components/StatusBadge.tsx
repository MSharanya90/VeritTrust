import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const norm = status ? status.toUpperCase() : 'UNKNOWN';

  let dotColor = 'var(--text-muted)';
  let bg = 'rgba(255, 255, 255, 0.05)';
  let text = 'var(--text-secondary)';

  if (norm === 'ACTIVE' || norm === 'APPROVED' || norm === 'COMPLETED' || norm === 'VERIFIED') {
    dotColor = 'var(--emerald-safe)';
    bg = 'rgba(16, 185, 129, 0.12)';
    text = '#6ee7b7';
  } else if (norm === 'PENDING' || norm === 'AWAITING_APPROVAL' || norm === 'INVESTIGATING' || norm === 'IN_PROGRESS') {
    dotColor = 'var(--amber-warning)';
    bg = 'rgba(245, 158, 11, 0.12)';
    text = '#fcd34d';
  } else if (norm === 'BLOCKED' || norm === 'REJECTED' || norm === 'FAILED' || norm === 'POISONED_SUSPECT') {
    dotColor = 'var(--crimson-critical)';
    bg = 'rgba(239, 68, 68, 0.15)';
    text = '#fca5a5';
  } else if (norm === 'UNDER_REVIEW') {
    dotColor = 'var(--rose-high)';
    bg = 'rgba(244, 63, 94, 0.12)';
    text = '#fda4af';
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
      padding: '0.2rem 0.55rem',
      borderRadius: 'var(--radius-full)',
      fontSize: '0.72rem',
      fontWeight: 600,
      backgroundColor: bg,
      color: text,
      border: `1px solid ${dotColor}33`
    }}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: dotColor,
        boxShadow: `0 0 6px ${dotColor}`
      }} />
      {norm.replace(/_/g, ' ')}
    </span>
  );
};

