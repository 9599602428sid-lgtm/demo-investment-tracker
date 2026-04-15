'use client';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  data: any[];
  isTrend?: boolean;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#14b8a6', '#f43f5e'];

export default function PerformanceChart({ data, isTrend }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="performance-chart-container" style={{ width: '100%', height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
        No data available
      </div>
    );
  }

  // Common styles
  const commonXAxis = (
    <XAxis 
      dataKey="name" 
      axisLine={false} 
      tickLine={false} 
      tick={{ fontSize: 12, fill: 'var(--text-3)', fontWeight: 500 }} 
      dy={10}
      interval={isTrend ? 'preserveStartEnd' : 0}
    />
  );

  const commonTooltip = (
    <Tooltip 
      formatter={(val: number) => ['₹' + val.toLocaleString('en-IN'), isTrend ? 'Net Worth' : 'Total Holdlings']}
      cursor={{ fill: 'var(--bg-surface-2)', opacity: 0.4 }}
      contentStyle={{ 
        backgroundColor: 'var(--bg-surface)', 
        borderRadius: 'var(--radius-md)', 
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
        fontWeight: 600,
        color: 'var(--text-1)',
      }}
      labelStyle={{ color: 'var(--text-2)', fontWeight: 500 }}
      itemStyle={{ color: 'var(--text-1)' }}
    />
  );

  return (
    <div className="performance-chart-container" style={{ width: '100%', marginTop: 20 }}>
      <ResponsiveContainer width="100%" height="100%">
        {isTrend ? (
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            {commonXAxis}
            <YAxis hide domain={['auto', 'auto']} />
            {commonTooltip}
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="var(--accent)" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorValue)" 
              animationDuration={1000}
            />
          </AreaChart>
        ) : (
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            {commonXAxis}
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'var(--text-3)' }}
              tickFormatter={(val) => {
                if (val >= 10_000_000) return '₹' + (val / 10_000_000).toFixed(1) + 'Cr';
                return '₹' + (val / 100_000).toFixed(0) + 'L';
              }}
            />
            {commonTooltip}
            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
