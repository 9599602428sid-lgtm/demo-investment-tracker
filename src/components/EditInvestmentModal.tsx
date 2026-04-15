'use client';
import { useState } from 'react';
import { Investment, FAMILY_MEMBERS, ADVISORS, InvestmentType } from '@/lib/supabase';

interface Props {
  investment: Investment;
  onEdit: (id: string, updates: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}

export default function EditInvestmentModal({ investment, onEdit, onClose }: Props) {
  const [form, setForm] = useState({
    type: investment.type,
    user_name: investment.user_name,
    advisor: investment.advisor || '',
    name: investment.name,
    quantity: investment.quantity?.toString() || '1',
    buy_price: investment.buy_price.toString(),
    buy_date: investment.buy_date,
    current_value: investment.current_value?.toString() || '',
    manual_current_price: (investment.type === 'stock' || investment.type === 'mutual_fund' || investment.type === 'unlisted_stock') && investment.current_value 
      ? (investment.current_value / (investment.quantity || 1)).toString() 
      : '',
    maturity_date: investment.maturity_date || '',
    notes: investment.notes || '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name) { setError('Please enter investment name'); return; }
    if (!form.buy_price) { setError('Buy price is required'); return; }
    if (!form.buy_date) { setError('Buy date is required'); return; }

    setSaving(true);
    try {
      const updates: Record<string, unknown> = {
        type: form.type,
        user_name: form.user_name,
        advisor: form.advisor || null,
        name: form.name,
        buy_price: parseFloat(form.buy_price),
        buy_date: form.buy_date,
        notes: form.notes || null,
      };

      if (form.type === 'stock' || form.type === 'mutual_fund' || form.type === 'bond' || form.type === 'unlisted_stock' || form.type === 'insurance') {
        updates.quantity = parseFloat(form.quantity) || 1;
        if (form.type === 'bond' || form.type === 'insurance') {
          updates.current_value = form.current_value ? parseFloat(form.current_value) : (parseFloat(form.buy_price) * (parseFloat(form.quantity) || 1));
          if (form.manual_current_price) {
            updates.current_value = parseFloat(form.manual_current_price) * (parseFloat(form.quantity) || 1);
          }
          updates.maturity_date = form.maturity_date || null;
        } else if (form.type === 'stock' || form.type === 'mutual_fund' || form.type === 'unlisted_stock') {
          if (form.manual_current_price) {
            updates.current_value = parseFloat(form.manual_current_price) * (parseFloat(form.quantity) || 1);
          } else {
            updates.current_value = null;
          }
        }
      } else {
        updates.quantity = 1;
        updates.current_value = form.current_value ? parseFloat(form.current_value) : parseFloat(form.buy_price);
        updates.maturity_date = form.maturity_date || null;
      }
      
      await onEdit(investment.id, updates);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save edits');
    } finally {
      setSaving(false);
    }
  };

  const isManual = form.type === 'insurance' || form.type === 'fd' || form.type === 'llp_capital' || form.type === 'llp_loan';
  const isUnitBased = form.type === 'stock' || form.type === 'mutual_fund' || form.type === 'bond' || form.type === 'unlisted_stock' || form.type === 'insurance';

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Edit Investment</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="stock">Stock</option>
                <option value="unlisted_stock">Unlisted Stock</option>
                <option value="mutual_fund">Mutual Fund</option>
                <option value="bond">Bond</option>
                <option value="insurance">Insurance</option>
                <option value="fd">Fixed Deposit</option>
                <option value="llp_capital">Capital in LLP</option>
                <option value="llp_loan">Loan to LLP &amp; Company</option>
              </select>
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

            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                className="form-input"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                readOnly={!isManual && form.type !== 'bond' && form.type !== 'unlisted_stock'}
                style={{ backgroundColor: (!isManual && form.type !== 'bond' && form.type !== 'unlisted_stock') ? 'var(--bg-2)' : undefined }}
              />
              {(!isManual && form.type !== 'bond' && form.type !== 'unlisted_stock') && <div className="form-hint" style={{ marginTop: 4 }}>Name is derived from {form.type === 'stock' ? 'ticker' : 'scheme code'}</div>}
            </div>

            <div className="form-row">
              {isUnitBased && (
                <div className="form-group">
                  <label className="form-label">{form.type === 'mutual_fund' ? 'Units' : form.type === 'bond' ? 'No. of Bonds' : form.type === 'insurance' ? 'No. of Policies' : 'Shares / Qty'}</label>
                  <input type="number" className="form-input" value={form.quantity} onChange={e => set('quantity', e.target.value)} min="0" step="any" />
                </div>
              )}
              <div className="form-group" style={{ gridColumn: !isUnitBased ? '1 / -1' : undefined }}>
                <label className="form-label">
                  {!isUnitBased ? 'Amount Invested (₹)' : form.type === 'mutual_fund' ? 'Buy NAV (₹)' : form.type === 'bond' ? 'Buy Price per Bond (₹)' : form.type === 'insurance' ? 'Premium per Policy (₹)' : 'Buy Price (₹)'}
                </label>
                <input type="number" className="form-input" value={form.buy_price} onChange={e => set('buy_price', e.target.value)} min="0" step="any" />
              </div>
            </div>

            {/* Current value (FD/Bond/Insurance) or Manual Price (Stock/MF) */}
            {(isManual || form.type === 'bond') ? (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Current Value (₹)</label>
                  <input type="number" className="form-input" value={form.current_value} onChange={e => set('current_value', e.target.value)} min="0" step="any" />
                </div>
                <div className="form-group">
                  <label className="form-label">Maturity Date</label>
                  <input type="date" className="form-input" value={form.maturity_date} onChange={e => set('maturity_date', e.target.value)} />
                </div>
              </div>
            ) : (
                <div className="form-group">
                  <label className="form-label">
                    Manual Current Price per {(form.type === 'stock' || form.type === 'unlisted_stock') ? 'Share' : 'Unit'} (₹) — 
                    <span style={{fontWeight: 400, fontSize: '0.9em', opacity: 0.8}}> Optional fallback</span>
                  </label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="Provide only if API price is missing" 
                    value={form.manual_current_price} 
                    onChange={e => set('manual_current_price', e.target.value)} 
                    min="0" 
                    step="any" 
                  />
                </div>
            )}

            <div className="form-group">
              <label className="form-label">Buy / Start Date</label>
              <input type="date" className="form-input" value={form.buy_date} onChange={e => set('buy_date', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <input className="form-input" value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>

            {error && <div className="error-msg">{error}</div>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: 'auto', padding: '10px 24px' }}>
              {saving ? <><span className="spinner" /> Saving…</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
