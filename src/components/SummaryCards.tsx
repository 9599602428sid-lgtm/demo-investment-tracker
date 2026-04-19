'use client';
import React from 'react';

interface Props {
  totalInvested: number;
  currentValue: number;
  loading?: boolean;
}

function fmt(n: number) {
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr';
  if (n >= 100000) return '₹' + (n / 100000).toFixed(2) + ' L';
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export default function SummaryCards({ totalInvested, currentValue, loading }: Props) {
  const pnl = currentValue - totalInvested;
  const pnlPct = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;
  const isPositive = pnl >= 0;

  const stats = [
    { label: 'Invested', value: fmt(totalInvested), color: 'var(--text-1)' },
    { label: 'Current', value: fmt(currentValue), color: 'var(--text-1)' },
    { label: 'P&L', value: (isPositive ? '+' : '') + fmt(pnl), color: isPositive ? 'var(--green)' : 'var(--red)' },
    { label: 'Returns', value: (isPositive ? '+' : '') + pnlPct.toFixed(2) + '%', color: isPositive ? 'var(--green)' : 'var(--red)' },
  ];

  return (
    <div className="sidebar-stats-grid summary-stats-grid">
      {stats.map((s) => (
        <div key={s.label} className="summary-card stats-card">
          <div className="summary-card-label stats-label">{s.label}</div>
          <div className="summary-card-value stats-value" style={{ color: s.color }}>
            {loading ? '...' : s.value}
          </div>
        </div>
      ))}
    </div>
  );
}
