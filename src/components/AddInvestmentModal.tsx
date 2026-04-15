'use client';
import { useState, useCallback, useRef } from 'react';
import { FAMILY_MEMBERS, ADVISORS, InvestmentType } from '@/lib/supabase';
// eslint-disable-next-line @typescript-eslint/no-unused-vars

interface Props {
  onAdd: (inv: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}

const TYPES: { value: InvestmentType; label: string; icon: string }[] = [
  { value: 'stock', label: 'Stock', icon: '📊' },
  { value: 'unlisted_stock', label: 'Unlisted Stock', icon: '🏢' },
  { value: 'mutual_fund', label: 'Mut. Fund', icon: '📁' },
  { value: 'bond', label: 'Bond', icon: '📜' },
  { value: 'insurance', label: 'Insurance', icon: '🛡️' },
  { value: 'fd', label: 'FD', icon: '🏦' },
  { value: 'llp_capital', label: 'LLP Capital', icon: '💼' },
  { value: 'llp_loan', label: 'Loan to LLP & Company', icon: '🤝' },
];

interface MfResult { schemeCode: number; schemeName: string; price?: number | null; }
interface StockResult { symbol: string; shortname?: string; longname?: string; exchange?: string; }

export default function AddInvestmentModal({ onAdd, onClose }: Props) {
  const [type, setType] = useState<InvestmentType>('stock');
  const [form, setForm] = useState({
    user_name: FAMILY_MEMBERS[0],
    advisor: '',
    name: '',
    ticker: '',
    scheme_code: '',
    quantity: '',
    buy_price: '',
    buy_date: new Date().toISOString().split('T')[0],
    current_value: '',
    manual_current_price: '',
    maturity_date: '',
    notes: '',
  });
  const [stockQuery, setStockQuery] = useState('');
  const [mfQuery, setMfQuery] = useState('');
  const [stockResults, setStockResults] = useState<StockResult[]>([]);
  const [mfResults, setMfResults] = useState<MfResult[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const stockTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mfTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Stock search via Yahoo Finance (server-side)
  const searchStock = useCallback((q: string) => {
    setStockQuery(q);
    setForm(f => ({ ...f, name: q }));
    clearTimeout(stockTimer.current);
    if (q.length < 1) { setStockResults([]); return; }
    stockTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stock-search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setStockResults(data);
      } catch { /* ignore */ }
    }, 350);
  }, []);

  // MF search via mfapi
  const searchMf = useCallback((q: string) => {
    setMfQuery(q);
    setForm(f => ({ ...f, name: q }));
    clearTimeout(mfTimer.current);
    if (q.length < 2) { setMfResults([]); return; }
    mfTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/mf-search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setMfResults(data);
      } catch { /* ignore */ }
    }, 350);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name) { setError('Please enter investment name'); return; }
    if (!form.buy_price) { setError('Buy price is required'); return; }
    if (!form.buy_date) { setError('Buy date is required'); return; }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        user_name: form.user_name,
        advisor: form.advisor || null,
        type,
        name: form.name,
        buy_price: parseFloat(form.buy_price),
        buy_date: form.buy_date,
        notes: form.notes || null,
      };
      if (type === 'stock' || type === 'mutual_fund' || type === 'unlisted_stock') {
        if (type === 'stock') payload.ticker = form.ticker || null;
        else if (type === 'mutual_fund') payload.scheme_code = form.scheme_code || null;
        payload.quantity = parseFloat(form.quantity) || 1;
        if (form.manual_current_price) {
          payload.current_value = parseFloat(form.manual_current_price) * (parseFloat(form.quantity) || 1);
        }
      } else if (type === 'bond' || type === 'insurance') {
        payload.quantity = parseFloat(form.quantity) || 1;
        payload.current_value = form.current_value ? parseFloat(form.current_value) : (parseFloat(form.buy_price) * (parseFloat(form.quantity) || 1));
        if (form.manual_current_price) {
           payload.current_value = parseFloat(form.manual_current_price) * (parseFloat(form.quantity) || 1);
        }
        payload.maturity_date = form.maturity_date || null;
      } else {
        payload.quantity = 1;
        payload.current_value = form.current_value ? parseFloat(form.current_value) : parseFloat(form.buy_price);
        payload.maturity_date = form.maturity_date || null;
      }
      await onAdd(payload);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const isManual = type === 'insurance' || type === 'fd' || type === 'llp_capital' || type === 'llp_loan';
  const isUnitBased = type === 'stock' || type === 'mutual_fund' || type === 'bond' || type === 'unlisted_stock' || type === 'insurance';

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Add Investment</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Type selector */}
            <div className="type-selector">
              {TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  className={`type-option${type === t.value ? ' selected' : ''}`}
                  onClick={() => setType(t.value)}
                >
                  <span className="type-option-icon">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Family Member</label>
                <select className="form-select" value={form.user_name} onChange={e => set('user_name', e.target.value)}>
                  {FAMILY_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Advisor (Optional)</label>
                <select className="form-select" value={form.advisor} onChange={e => set('advisor', e.target.value)}>
                  <option value="">DIRECT</option>
                  {ADVISORS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* Stock: search */}
            {type === 'stock' && (
              <div className="form-group">
                <label className="form-label">Search Stock (NSE)</label>
                <div className="search-wrapper">
                  <input
                    className="form-input"
                    placeholder="Type company name, e.g. Reliance, TCS…"
                    value={stockQuery}
                    onChange={e => searchStock(e.target.value)}
                    autoComplete="off"
                  />
                  {stockResults.length > 0 && (
                    <div className="search-results">
                      {stockResults.map((s: any) => (
                        <div
                          key={s.symbol}
                          className="search-result-item"
                          onClick={() => {
                            set('ticker', s.symbol);
                            set('name', s.shortname || s.longname || s.symbol);
                            if (s.price != null) set('buy_price', String(s.price));
                            setStockQuery(s.shortname || s.longname || s.symbol);
                            setStockResults([]);
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="search-result-name">{s.shortname || s.longname || s.symbol}</div>
                            {s.price != null && (
                              <div style={{ fontWeight: 600, color: 'var(--accent)' }}>₹{s.price.toFixed(2)}</div>
                            )}
                          </div>
                          <div className="search-result-sub">{s.symbol} · {s.exchange}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {form.ticker && (
                  <div className="form-hint">✅ Ticker: <strong>{form.ticker}</strong></div>
                )}
              </div>
            )}

            {/* Mutual fund: search */}
            {type === 'mutual_fund' && (
              <div className="form-group">
                <label className="form-label">Search Mutual Fund</label>
                <div className="search-wrapper">
                  <input
                    className="form-input"
                    placeholder="Type fund name, e.g. Axis Bluechip, HDFC Mid Cap…"
                    value={mfQuery}
                    onChange={e => searchMf(e.target.value)}
                    autoComplete="off"
                  />
                  {mfResults.length > 0 && (
                    <div className="search-results">
                      {mfResults.map(f => (
                        <div
                          key={f.schemeCode}
                          className="search-result-item"
                          onClick={() => {
                            set('scheme_code', String(f.schemeCode));
                            set('name', f.schemeName);
                            if (f.price != null) set('buy_price', String(f.price));
                            setMfQuery(f.schemeName);
                            setMfResults([]);
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="search-result-name">{f.schemeName}</div>
                            {f.price != null && (
                              <div style={{ fontWeight: 600, color: 'var(--accent)', flexShrink: 0, paddingLeft: 10 }}>₹{f.price.toFixed(2)}</div>
                            )}
                          </div>
                          <div className="search-result-sub">Code: {f.schemeCode}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {form.scheme_code && (
                  <div className="form-hint">✅ Scheme: <strong>{form.scheme_code}</strong></div>
                )}
              </div>
            )}

            {/* Manual name for bond/insurance/FD/unlisted_stock/LLP */}
            {(isManual || type === 'bond' || type === 'unlisted_stock') && (
              <div className="form-group">
                <label className="form-label">
                  {type === 'fd' ? 'Bank & FD Name' : type === 'unlisted_stock' ? 'Stock Name' : type === 'bond' ? 'Bond Name / ISIN' : type === 'llp_capital' ? 'LLP / Firm Name' : type === 'llp_loan' ? 'LLP / Company Name' : 'Policy Name'}
                </label>
                <input
                  className="form-input"
                  placeholder={type === 'fd' ? 'e.g. SBI FD — 7.5%' : type === 'unlisted_stock' ? 'e.g. Acme Corp Unlisted' : type === 'bond' ? 'e.g. GOI Bond 2028' : type === 'llp_capital' ? 'e.g. CBSL Group LLP' : type === 'llp_loan' ? 'e.g. CBSL Industries Pvt Ltd' : 'e.g. LIC Jeevan Anand'}
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                />
              </div>
            )}

            {/* Qty + Buy price */}
            <div className="form-row">
              {isUnitBased && (
                <div className="form-group">
                  <label className="form-label">{type === 'mutual_fund' ? 'Units' : type === 'bond' ? 'No. of Bonds' : type === 'insurance' ? 'No. of Policies' : 'Shares / Qty'}</label>
                  <input type="number" className="form-input" placeholder="0" value={form.quantity} onChange={e => set('quantity', e.target.value)} min="0" step="any" />
                </div>
              )}
              <div className="form-group" style={{ gridColumn: !isUnitBased ? '1 / -1' : undefined }}>
                <label className="form-label">
                  {!isUnitBased ? 'Amount Invested (₹)' : type === 'mutual_fund' ? 'Buy NAV (₹)' : type === 'bond' ? 'Buy Price per Bond (₹)' : type === 'insurance' ? 'Premium per Policy (₹)' : 'Buy Price (₹)'}
                </label>
                <input type="number" className="form-input" placeholder="0.00" value={form.buy_price} onChange={e => set('buy_price', e.target.value)} min="0" step="any" />
              </div>
            </div>

            {/* Current value (FD/Bond/Insurance) or Manual Price (Stock/MF/Unlisted) */}
            {(isManual || type === 'bond') ? (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Current Value (₹)</label>
                  <input type="number" className="form-input" placeholder="Same as invested" value={form.current_value} onChange={e => set('current_value', e.target.value)} min="0" step="any" />
                </div>
                <div className="form-group">
                  <label className="form-label">Maturity Date</label>
                  <input type="date" className="form-input" value={form.maturity_date} onChange={e => set('maturity_date', e.target.value)} />
                </div>
              </div>
            ) : (
                <div className="form-group">
                  <label className="form-label">Manual Current Price per {(type === 'stock' || type === 'unlisted_stock') ? 'Share' : 'Unit'} (₹) — <span style={{fontWeight: 400, fontSize: '0.9em', opacity: 0.8}}>Optional fallback</span></label>
                  <input type="number" className="form-input" placeholder="Enter only if API price is wrong/missing/unlisted" value={form.manual_current_price} onChange={e => set('manual_current_price', e.target.value)} min="0" step="any" />
                </div>
            )}

            {/* Buy date */}
            <div className="form-group">
              <label className="form-label">Buy / Start Date</label>
              <input type="date" className="form-input" value={form.buy_date} onChange={e => set('buy_date', e.target.value)} />
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <input className="form-input" placeholder="Any remarks…" value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>

            <div style={{ 
              marginTop: '1.5rem', 
              padding: '12px', 
              backgroundColor: 'rgba(52, 152, 219, 0.1)', 
              borderRadius: '8px',
              border: '1px dashed var(--accent)',
              fontSize: '12px',
              lineHeight: '1.5',
              color: 'var(--text-2)'
            }}>
              <strong style={{ color: 'var(--accent)', display: 'block', marginBottom: '4px' }}>ℹ️ Demo Version Notice</strong>
              You can add new investments to see how they appear on the dashboard. 
              Editing or deleting is disabled in this demo, and your new entries will stay saved for 10 minutes before being cleared.
            </div>

            {error && <div className="error-msg">{error}</div>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: 'auto', padding: '10px 24px' }}>
              {saving ? <><span className="spinner" /> Saving…</> : '+ Add Investment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
