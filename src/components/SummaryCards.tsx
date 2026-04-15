'use client';
import React from 'react';
import { Wallet, TrendingUp, BarChart3, PieChart } from 'lucide-react';

interface Props {
  totalInvested: number;
  currentValue: number;
  loading?: boolean;
}

function fmt(n: number) {
  if (n >= 10_000_000) return '₹' + (n / 10_000_000).toFixed(2) + ' Cr';
  if (n >= 100_000) return '₹' + (n / 100_000).toFixed(2) + ' L';
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export default function SummaryCards({ totalInvested, currentValue, loading }: Props) {
  const pnl = currentValue - totalInvested;
  const pnlPct = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;
  const isPositive = pnl >= 0;

  const stats = [
    { label: 'Total Invested', value: fmt(totalInvested), icon: Wallet, color: 'var(--accent)' },
    { label: 'Current Value', value: fmt(currentValue), icon: TrendingUp, color: 'var(--accent)' },
    { label: 'Total P&L', value: (isPositive ? '+' : '') + fmt(pnl), icon: BarChart3, color: isPositive ? 'var(--green)' : 'var(--red)' },
    { label: 'Total Returns', value: (isPositive ? '+' : '') + pnlPct.toFixed(2) + '%', icon: PieChart, color: isPositive ? 'var(--green)' : 'var(--red)' },
  ];

  return (
    <div className="sidebar-stats-grid">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="summary-card interactive-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div className="summary-card-label" style={{ margin: 0 }}>{s.label}</div>
              <div style={{ 
                width: 32, height: 32, borderRadius: 'var(--radius-md)', 
                backgroundColor: s.color + '10', color: s.color,
                display: 'flex', alignItems: 'center', justifyCenter: 'center', padding: 6
              }}>
                <Icon size={20} />
              </div>
            </div>
            <div className="summary-card-value">
              {loading ? '...' : s.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
