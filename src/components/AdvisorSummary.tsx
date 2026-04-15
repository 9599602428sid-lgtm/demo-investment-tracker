'use client';
import { Investment, ADVISORS } from '@/lib/supabase';

interface Props {
  investments: Investment[];
  livePrices: Record<string, { price: number; change: number | null; percent: number | null } | null>;
  mfNavs: Record<string, number | null>;
}

const TARGET_ADVISORS = ADVISORS;

function fmt(n: number) {
  if (n >= 10_000_000) return '₹' + (n / 10_000_000).toFixed(2) + ' Cr';
  if (n >= 100_000) return '₹' + (n / 100_000).toFixed(2) + ' L';
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export default function AdvisorSummary({ investments, livePrices, mfNavs }: Props) {
  // We only want to consider target advisors
  const relevantInvs = investments.filter(i => 
    i.advisor && TARGET_ADVISORS.includes(i.advisor) && 
    (i.type === 'stock' || i.type === 'mutual_fund' || i.type === 'unlisted_stock')
  );

  if (relevantInvs.length === 0) return null;

  const summary = TARGET_ADVISORS.map(adv => {
    let invested = 0;
    let current = 0;

    relevantInvs.filter(i => i.advisor === adv).forEach(inv => {
      let livePrice: number | null = null;
      if (inv.type === 'stock' && inv.ticker) livePrice = livePrices[inv.ticker]?.price ?? null;
      if (inv.type === 'mutual_fund' && inv.scheme_code) livePrice = mfNavs[inv.scheme_code] ?? null;

      const invInvested = inv.buy_price * inv.quantity;
      const invCurrent = livePrice != null ? livePrice * inv.quantity : (inv.current_value ?? invInvested);

      invested += invInvested;
      current += invCurrent;
    });

    const pnl = current - invested;
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
    
    return { advisor: adv, invested, current, pnl, pnlPct };
  });

  return (
    <div style={{ marginBottom: 24 }}>
      <div className="section-title" style={{ marginBottom: 12 }}>Advisor P&amp;L Summary (Stocks / Mut. Funds)</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {summary.map((s) => {
          if (s.invested === 0 && s.current === 0) return null; // Hide if no investments
          const isPositive = s.pnl >= 0;
          return (
            <div 
              key={s.advisor} 
              className="summary-card" 
              style={{ 
                padding: '16px', 
                borderTop: '3px solid var(--accent)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 16 }}>🧑‍💼</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {s.advisor}
                </span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1, marginBottom: 6 }}>
                {fmt(s.current)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>{fmt(s.invested)} invested</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: isPositive ? 'var(--green)' : 'var(--red)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{isPositive ? '+' : ''}{fmt(s.pnl)}</span>
                <span>{isPositive ? '+' : ''}{s.pnlPct.toFixed(2)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
