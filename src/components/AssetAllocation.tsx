'use client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  data: Record<string, { invested: number; current: number }>;
  totalCurrent: number;
}

const COLORS = {
  stock: '#6366f1',
  mutual_fund: '#10b981',
  bond: '#f59e0b',
  insurance: '#8b5cf6',
  fd: '#14b8a6',
  unlisted_stock: '#64748b',
  llp_capital: '#e67e22',
  llp_loan: '#3498db',
};

const LABELS: Record<string, string> = {
  stock: 'Stocks',
  mutual_fund: 'Mut. Funds',
  bond: 'Bonds',
  insurance: 'Insurance',
  fd: 'FDs',
  unlisted_stock: 'Unlisted',
  llp_capital: 'LLP Capital',
  llp_loan: 'LLP Loans',
};

export default function AssetAllocation({ data, totalCurrent }: Props) {
  const chartData = Object.entries(data)
    .filter(([_, vals]) => vals.current > 0)
    .map(([type, vals]) => ({
      name: LABELS[type] || type,
      value: vals.current,
      type,
    }));

  if (chartData.length === 0) return null;

  return (
    <div className="section-row" style={{ marginTop: 32, marginBottom: 32 }}>
      <div className="table-container allocation-container">
        <div className="allocation-chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={70}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.type as keyof typeof COLORS] || '#ddd'} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(val: number) => '₹' + val.toLocaleString('en-IN')}
                contentStyle={{ 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--border)', 
                  boxShadow: 'var(--shadow-lg)', 
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-1)',
                }}
                labelStyle={{ color: 'var(--text-2)' }}
                itemStyle={{ color: 'var(--text-1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div style={{ flex: 1 }}>
          <h3 className="section-title" style={{ marginBottom: 20 }}>Asset Allocation</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {chartData.map((d) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: COLORS[d.type as keyof typeof COLORS] }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    {((d.value / totalCurrent) * 100).toFixed(1)}% ({(() => {
                      const n = d.value;
                      if (n >= 10_000_000) return '₹' + (n / 10_000_000).toFixed(2) + ' Cr';
                      return '₹' + (n / 100_000).toFixed(1) + 'L';
                    })()})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
