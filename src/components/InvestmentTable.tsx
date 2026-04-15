'use client';
import { Investment } from '@/lib/supabase';
import { Edit2, Trash2, TrendingUp, Building2, FolderKanban, Scroll, ShieldCheck, Landmark, Briefcase, HandCoins } from 'lucide-react';

interface Props {
  investments: Investment[];
  livePrices: Record<string, { price: number; change: number | null; percent: number | null } | null>;
  mfNavs: Record<string, number | null>;
  loading: boolean;
  onEdit: (inv: Investment) => void;
  onDelete: (id: string) => void;
}

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  stock: { label: 'Stock', icon: TrendingUp, color: 'var(--accent)' },
  unlisted_stock: { label: 'Unlisted', icon: Building2, color: 'var(--text-2)' },
  mutual_fund: { label: 'Mut. Fund', icon: FolderKanban, color: 'var(--green)' },
  bond: { label: 'Bond', icon: Scroll, color: 'var(--amber)' },
  insurance: { label: 'Insurance', icon: ShieldCheck, color: 'var(--purple)' },
  fd: { label: 'FD', icon: Landmark, color: 'var(--teal)' },
  llp_capital: { label: 'LLP Capital', icon: Briefcase, color: '#e67e22' },
  llp_loan: { label: 'LLP Loan', icon: HandCoins, color: '#3498db' },
};

function getLivePrice(inv: Investment, livePrices: Record<string, { price: number; change: number | null } | null>, mfNavs: Record<string, number | null>): number | null {
  if (inv.type === 'stock' && inv.ticker) return livePrices[inv.ticker]?.price ?? null;
  if (inv.type === 'mutual_fund' && inv.scheme_code) return mfNavs[inv.scheme_code] ?? null;
  return null;
}

function computePnL(inv: Investment, livePrice: number | null) {
  let invested = 0, current = 0;
  if (inv.type === 'stock' || inv.type === 'mutual_fund' || inv.type === 'bond' || inv.type === 'unlisted_stock') {
    invested = inv.buy_price * inv.quantity;
    current = livePrice != null ? livePrice * inv.quantity : (inv.current_value ?? invested);
  } else {
    invested = inv.buy_price;
    current = inv.current_value ?? invested;
  }
  const pnl = current - invested;
  const pct = invested > 0 ? (pnl / invested) * 100 : 0;
  return { invested, current, pnl, pct };
}

function computeCAGR(invested: number, current: number, buyDate?: string): number | null {
  if (!buyDate || invested <= 0 || current <= 0) return null;
  const buy = new Date(buyDate).getTime();
  const now = new Date().getTime();
  const days = (now - buy) / (1000 * 60 * 60 * 24);
  if (days < 30) return null;
  const years = days / 365.25;
  if (years < 1) return ((current / invested) - 1) * 100;
  return (Math.pow(current / invested, 1 / years) - 1) * 100;
}

export default function InvestmentTable({ investments, livePrices, mfNavs, loading, onEdit, onDelete }: Props) {
  if (loading) {
    return (
      <div className="table-container">
        <div className="loading-row" style={{ padding: 64, textAlign: 'center' }}>
          <div className="spinner" style={{ borderTopColor: 'var(--accent)' }} />
          <div style={{ marginTop: 16, color: 'var(--text-3)', fontSize: 13 }}>Fetching your portfolio details…</div>
        </div>
      </div>
    );
  }

  if (!investments.length) {
    return (
      <div className="table-container">
        <div className="empty-state" style={{ padding: '80px 20px' }}>
          <div style={{ color: 'var(--text-3)', marginBottom: 16 }}><FolderKanban size={48} strokeWidth={1.5} /></div>
          <div className="empty-state-text">No investments found</div>
          <div className="empty-state-sub">Adjust your filters or add a new investment to start tracking.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Entity Name</th>
              <th>Asset Category</th>
              <th>Advisor</th>
              <th className="text-right">Holding</th>
              <th className="text-right">Acquisition</th>
              <th className="text-right">Live Price</th>
              <th className="text-right">Capital</th>
              <th className="text-right">Valuation</th>
              <th className="text-right">Returns</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {investments.map((inv) => {
              const livePrice = getLivePrice(inv, livePrices, mfNavs);
              const { invested, current, pnl, pct } = computePnL(inv, livePrice);
              const cagr = computeCAGR(invested, current, inv.buy_date);
              const isPos = pnl >= 0;
              const hasLive = inv.type === 'stock' || inv.type === 'mutual_fund';
              const isUnitBased = hasLive || inv.type === 'bond' || inv.type === 'unlisted_stock' || inv.type === 'insurance';
              const config = TYPE_CONFIG[inv.type];
              const Icon = config.icon;

              return (
                <tr key={inv.id}>
                  <td>
                    <div className="cell-name">{inv.name}</div>
                    <div className="cell-ticker" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {inv.ticker || inv.scheme_code || (inv.user_name)}
                    </div>
                  </td>
                  <td>
                    <span className={`type-badge badge-${inv.type}`} style={{ gap: 6 }}>
                      <Icon size={12} strokeWidth={2.5} />
                      {config.label}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-2)', fontSize: 12 }}>
                    {inv.advisor || 'DIRECT'}
                  </td>
                  <td className="cell-number" style={{ fontWeight: 500 }}>
                    {isUnitBased ? inv.quantity.toLocaleString('en-IN') : '—'}
                  </td>
                  <td className="cell-number" style={{ fontSize: 12, color: 'var(--text-2)' }}>{fmt(inv.buy_price)}</td>
                  <td className="cell-number">
                    {hasLive ? (
                      livePrice != null ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span className="live-dot" style={{ boxShadow: '0 0 8px var(--green)' }} />
                          <span style={{ fontWeight: 600 }}>{fmt(livePrice)}</span>
                        </div>
                      ) : (inv.current_value != null && inv.quantity > 0) ? (
                        <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{fmt(inv.current_value / inv.quantity)} (M)</span>
                      ) : '—'
                    ) : (
                      <span style={{ color: 'var(--text-3)', fontSize: 11 }}>FIXED</span>
                    )}
                  </td>
                  <td className="cell-number" style={{ fontWeight: 500 }}>{fmt(invested)}</td>
                  <td className="cell-number" style={{ fontWeight: 700, color: 'var(--text-1)' }}>{fmt(current)}</td>
                  <td className="cell-number">
                    <div className="pnl-cell">
                      <span className={`pnl-value ${isPos ? 'positive' : 'negative'}`} style={{ fontWeight: 700 }}>
                        {isPos ? '▲' : '▼'} {fmt(Math.abs(pnl))}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: isPos ? 'var(--green)' : 'var(--red)', opacity: 0.8 }}>
                        {pct.toFixed(2)}% {cagr != null && ` | ${cagr.toFixed(1)}% IRR`}
                      </span>
                    </div>
                  </td>
                  <td className="cell-number">
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost" title="Edit" style={{ width: 32, height: 32, padding: 0 }} onClick={() => onEdit(inv)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-danger" title="Delete" style={{ width: 32, height: 32, padding: 0, backgroundColor: 'transparent', color: 'var(--red)' }} onClick={() => onDelete(inv.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
