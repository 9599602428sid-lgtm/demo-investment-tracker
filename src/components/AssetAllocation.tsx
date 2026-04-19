'use client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS: Record<string, string> = {
  stock: '#7000FF', // Indigo
  mutual_fund: '#00F0FF', // Cyan
  bond: '#00FF94', // Neon Green
  insurance: '#FF0055', // Red
  fd: '#A0A0A0', // Gray
  unlisted_stock: '#1F1F1F', // Dark
  llp_capital: '#FFD700', // Gold
  llp_loan: '#3498db',
};

const LABELS: Record<string, string> = {
  stock: 'Stocks',
  mutual_fund: 'Mut. Funds',
  bond: 'Bonds',
  insurance: 'Insurance',
  fd: 'FDs',
  unlisted_stock: 'Unlisted',
  llp_capital: "Capital In LLP's",
  llp_loan: 'Loan to LLP & Company',
};

interface Props {
  data: Record<string, { invested: number; current: number }>;
  totalCurrent: number;
  onSelectType: (type: string) => void;
}

export default function AssetAllocation({ data, totalCurrent, onSelectType }: Props) {
  const chartData = Object.entries(data)
    .filter(([_, vals]) => vals.current > 0)
    .map(([type, vals]) => ({
      name: LABELS[type] || type,
      value: vals.current,
      type,
    }));

  if (chartData.length === 0) return null;

  return (
    <div className="section-row allocation-section">
      <div className="glass allocation-card">
        <div className="allocation-chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius="70%"
                outerRadius="90%"
                paddingAngle={8}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.type] || '#333'} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(val: number) => '₹' + val.toLocaleString('en-IN')}
                contentStyle={{ 
                  borderRadius: 'var(--radius-xl)', 
                  border: '1px solid var(--border)', 
                  boxShadow: 'var(--shadow-lg)', 
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-1)',
                  backdropFilter: 'blur(10px)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="allocation-details">
          <h3 className="section-title allocation-title">Strategic Allocation</h3>
          <div className="allocation-list">
            {chartData.map((d) => (
              <div 
                key={d.name} 
                onClick={() => onSelectType(d.type)}
                className="allocation-item"
              >
                <div className="allocation-color-dot" style={{ backgroundColor: COLORS[d.type] }} />
                <div className="allocation-item-text">
                  <div className="allocation-item-name">{d.name}</div>
                  <div className="allocation-item-percent">
                    {((d.value / totalCurrent) * 100).toFixed(1)}%
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
