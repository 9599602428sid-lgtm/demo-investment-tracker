'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Investment, FAMILY_MEMBERS } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/client';
import PerformanceChart from '@/components/PerformanceChart';
import LiveClock from '@/components/LiveClock';
import SummaryCards from '@/components/SummaryCards';
import UserFilter from '@/components/UserFilter';
import InvestmentTable from '@/components/InvestmentTable';
import AddInvestmentModal from '@/components/AddInvestmentModal';
import EditInvestmentModal from '@/components/EditInvestmentModal';
import AssetAllocation from '@/components/AssetAllocation';
import AdvisorSummary from '@/components/AdvisorSummary';
import StockTicker from '@/components/StockTicker';
import MarketIndexHeader from '@/components/MarketIndexHeader';
import ThemeToggle from '@/components/ThemeToggle';

type Toast = { msg: string; type: 'success' | 'error' };

export default function DashboardPage() {
  const router = useRouter();
  const tableRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, { price: number; change: number | null; percent: number | null } | null>>({});
  const [mfNavs, setMfNavs] = useState<Record<string, number | null>>({});
  const [selectedUser, setSelectedUser] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'priority', direction: 'asc' });
  const [showModal, setShowModal] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // ── Auth guard ──────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/');
    });
  }, [router]);

  // ── Show toast ──────────────────────────────────────────
  const showToast = (msg: string, type: Toast['type'] = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch live prices ───────────────────────────────────
  const fetchPrices = useCallback(async (invs: Investment[]) => {
    const tickers = [...new Set(invs.filter(i => i.type === 'stock' && i.ticker).map(i => i.ticker!))];
    const codes = [...new Set(invs.filter(i => i.type === 'mutual_fund' && i.scheme_code).map(i => i.scheme_code!))];

    await Promise.all([
      (async () => {
        if (tickers.length > 0) {
          try {
            const res = await fetch(`/api/prices?tickers=${encodeURIComponent(tickers.join(','))}`);
            const data = await res.json();
            setLivePrices(data);
          } catch { /* ignore */ }
        }
      })(),
      (async () => {
        if (codes.length > 0) {
          try {
            const res = await fetch(`/api/mf-nav?codes=${encodeURIComponent(codes.join(','))}`);
            const data = await res.json();
            setMfNavs(data);
          } catch { /* ignore */ }
        }
      })()
    ]);
  }, []);

  // ── Fetch investments ───────────────────────────────────
  const fetchInvestments = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch('/api/investments');
      const data: Investment[] = await res.json();
      setInvestments(data);
      await fetchPrices(data);
    } catch {
      showToast('Failed to load investments', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchPrices]);

  useEffect(() => { fetchInvestments(); }, [fetchInvestments]);

  // ── Add investment ──────────────────────────────────────
  const handleAdd = async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/investments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add');
    }
    setShowModal(false);
    showToast('Investment added ✅');
    await fetchInvestments();
  };

  // ── Edit investment ─────────────────────────────────────
  const handleEdit = async (id: string, updates: Record<string, unknown>) => {
    const res = await fetch('/api/investments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, updates }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to edit');
    }
    setEditingInvestment(null);
    showToast('Investment updated ✅');
    await fetchInvestments();
  };

  // ── Delete investment ───────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this investment?')) return;
    const res = await fetch('/api/investments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) { showToast('Delete failed', 'error'); return; }
    showToast('Investment deleted');
    setInvestments(prev => prev.filter(i => i.id !== id));
  };

  // ── History Tracking ────────────────────────────────────
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    async function fetchHistory() {
      const { data, error } = await supabase
        .from('portfolio_history')
        .select('*')
        .eq('user_name', selectedUser)
        .order('snapshot_date', { ascending: true });
      
      if (!error && data) {
        setHistory(data.map(d => ({
          name: d.snapshot_date,
          value: Number(d.total_value)
        })));
      }
    }
    fetchHistory();
  }, [selectedUser, supabase]);


  // ── Logout ──────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  // ── Filtering & stats ───────────────────────────────────
  let filtered = investments;

  if (selectedUser !== 'All') {
    filtered = filtered.filter(i => i.user_name.toLowerCase() === selectedUser.toLowerCase());
  }
  
  if (selectedType !== 'All') {
    filtered = filtered.filter(i => i.type === selectedType);
  }

  if (searchQuery.trim()) {
    const lowerQ = searchQuery.toLowerCase();
    filtered = filtered.filter(i => 
      i.name.toLowerCase().includes(lowerQ) || 
      (i.ticker && i.ticker.toLowerCase().includes(lowerQ)) || 
      (i.scheme_code && i.scheme_code.toLowerCase().includes(lowerQ))
    );
  }

  // Sorting
  filtered.sort((a, b) => {
    const { invested: invA, current: curA, pnl: pnlA } = getPnL(a);
    const { invested: invB, current: curB, pnl: pnlB } = getPnL(b);

    if (sortConfig.key === 'priority') {
      const getPriority = (inv: Investment) => {
        if (inv.type === 'stock' && inv.ticker) return 1;
        if (inv.type === 'stock' && !inv.ticker) return 2;
        if (inv.type === 'mutual_fund' && inv.scheme_code) return 3;
        if (inv.type === 'mutual_fund' && !inv.scheme_code) return 4;
        return 5;
      };
      const pA = getPriority(a);
      const pB = getPriority(b);
      if (pA !== pB) return pA - pB;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }

    let valA: any, valB: any;
    switch(sortConfig.key) {
      case 'name': valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); break;
      case 'type': valA = a.type; valB = b.type; break;
      case 'invested': valA = invA; valB = invB; break;
      case 'current': valA = curA; valB = curB; break;
      case 'pnl': valA = pnlA; valB = pnlB; break;
      default: return 0;
    }

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (combinedValue: string) => {
    if (combinedValue === 'priority') {
      setSortConfig({ key: 'priority', direction: 'asc' });
      return;
    }
    const [key, direction] = combinedValue.split('-') as [string, 'asc' | 'desc'];
    setSortConfig({ key, direction });
  };

  const counts: Record<string, number> = { All: investments.length };
  FAMILY_MEMBERS.forEach(m => { counts[m] = investments.filter(i => i.user_name.toLowerCase() === m.toLowerCase()).length; });

  function getPnL(inv: Investment) {
    const livePrice = inv.type === 'stock' && inv.ticker
      ? livePrices[inv.ticker]?.price ?? null
      : inv.type === 'mutual_fund' && inv.scheme_code
      ? mfNavs[inv.scheme_code] ?? null
      : null;

    if (inv.type === 'stock' || inv.type === 'mutual_fund' || inv.type === 'bond' || inv.type === 'unlisted_stock') {
      const invested = inv.buy_price * inv.quantity;
      const current = livePrice != null ? livePrice * inv.quantity : (inv.current_value ?? invested);
      return { invested, current };
    }
    const invested = inv.buy_price;
    const current = inv.current_value ?? invested;
    return { invested, current };
  }

  const handleResetFilters = () => {
    setSelectedUser('All');
    setSelectedType('All');
    setSearchQuery('');
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  let totalInvested = 0, totalCurrent = 0;
  const allocationData: Record<string, { invested: number; current: number }> = {
    stock: { invested: 0, current: 0 },
    unlisted_stock: { invested: 0, current: 0 },
    mutual_fund: { invested: 0, current: 0 },
    fd: { invested: 0, current: 0 },
    bond: { invested: 0, current: 0 },
    insurance: { invested: 0, current: 0 },
    llp_capital: { invested: 0, current: 0 },
    llp_loan: { invested: 0, current: 0 },
  };

  const userDistribution: Record<string, number> = {};
  filtered.forEach(inv => {
    const { invested, current } = getPnL(inv);
    totalInvested += invested;
    totalCurrent += current;
    
    // Wealth by person
    const person = inv.user_name;
    userDistribution[person] = (userDistribution[person] || 0) + current;

    if (allocationData[inv.type]) {
      allocationData[inv.type].invested += invested;
      allocationData[inv.type].current += current;
    }
  });

  const handleExportCSV = () => {
    const headers = ['Name', 'Ticker/Code', 'Type', 'Advisor', 'Family Member', 'Qty/Units', 'Buy Price', 'Live/Current Price', 'Invested Amount', 'Current Value', 'P&L', 'P&L %'];
    
    const rows = filtered.map(inv => {
      const livePriceValue = inv.type === 'stock' && inv.ticker
        ? livePrices[inv.ticker]?.price ?? null
        : inv.type === 'mutual_fund' && inv.scheme_code
        ? mfNavs[inv.scheme_code] ?? null
        : null;

      let invested = 0, current = 0;
      if (inv.type === 'stock' || inv.type === 'mutual_fund' || inv.type === 'bond' || inv.type === 'unlisted_stock') {
        invested = inv.buy_price * inv.quantity;
        current = livePriceValue != null ? livePriceValue * inv.quantity : (inv.current_value ?? invested);
      } else {
        invested = inv.buy_price;
        current = inv.current_value ?? invested;
      }
      
      const pnl = current - invested;
      const pct = invested > 0 ? (pnl / invested) * 100 : 0;
      
      const escape = (str: string) => `"${str.replace(/"/g, '""')}"`;
      
      return [
        escape(inv.name),
        escape(inv.ticker || inv.scheme_code || ''),
        inv.type.toUpperCase(),
        escape(inv.advisor || ''),
        escape(inv.user_name),
        (inv.type === 'stock' || inv.type === 'mutual_fund' || inv.type === 'bond' || inv.type === 'unlisted_stock') ? inv.quantity : '',
        inv.buy_price,
        livePriceValue != null ? livePriceValue : (inv.current_value ?? inv.buy_price),
        invested.toFixed(2),
        current.toFixed(2),
        pnl.toFixed(2),
        pct.toFixed(2) + '%'
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Portfolio_${selectedUser.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const userDistributionArray = Object.entries(userDistribution)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name: name.split(' ')[0], value }));

  return (
    <div className="app-layout">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-left">
          <div className="header-logo">📈</div>
          <div>
            <div className="header-title">Family Investment Tracker</div>
          </div>
        </div>
        <div className="header-right">
          <MarketIndexHeader />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LiveClock />
            <ThemeToggle />
            <button className="logout-btn" onClick={handleLogout}>⏻ Logout</button>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="dashboard-content">
        <div style={{
          backgroundColor: 'var(--card-bg)',
          borderLeft: '4px solid var(--accent)',
          padding: '12px 20px',
          marginBottom: '20px',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px'
        }}>
          <span style={{ fontSize: '18px' }}>💡</span>
          <span>
            <strong>Public Demo Mode:</strong> You can add, edit or delete data. New entries are automatically cleared after 10 minutes to maintain this demo for all viewers.
          </span>
        </div>

        <StockTicker investments={investments} livePrices={livePrices} mfNavs={mfNavs} />
        
        <div className="table-container hero-grid">
          <div>
            <div className="section-title">
              {history.length > 1 ? 'Portfolio Performance History' : 'Current Wealth Distribution'}
            </div>
            <PerformanceChart 
              data={history.length > 1 ? history : userDistributionArray} 
              isTrend={history.length > 1}
            />
          </div>
          <div className="hero-metrics">
            <div className="section-title" style={{ marginBottom: 16 }}>Key Metrics</div>
            <SummaryCards
              totalInvested={totalInvested}
              currentValue={totalCurrent}
              loading={loading}
            />
          </div>
        </div>

        {/* Asset Allocation */}
        <AssetAllocation 
          data={allocationData}
          totalCurrent={totalCurrent}
          onSelectType={handleTypeSelect}
        />

        {/* Advisor Summary */}
        <AdvisorSummary 
          investments={filtered}
          livePrices={livePrices}
          mfNavs={mfNavs}
        />

        {/* User filter */}
        <UserFilter selected={selectedUser} onChange={setSelectedUser} counts={counts} />

        <div className="investments-box-container">
          {/* Table header row - Sticky inside the box */}
          <div className="sticky-section-header">
            <div className="section-row" ref={tableRef} style={{ scrollMarginTop: '80px', margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="section-title">
                  {selectedUser === 'All' ? 'Live Investments' : `${selectedUser.split(' ')[0]}'s Live Investments`}
                </span>
                {(selectedUser !== 'All' || selectedType !== 'All' || searchQuery !== '') && (
                  <button 
                    className="btn btn-ghost" 
                    onClick={handleResetFilters}
                    style={{ padding: '4px 10px', fontSize: '11px', height: '26px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    ← Back to All
                  </button>
                )}
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {filtered.filter(i => i.type === 'stock' || i.type === 'mutual_fund').length} entries
                </span>
              </div>
              <div className="toolbar-right">
                <select 
                  className="form-select toolbar-select" 
                  value={selectedType} 
                  onChange={e => setSelectedType(e.target.value)}
                >
                  <option value="All">All Assets</option>
                  <option value="stock">Stocks</option>
                  <option value="mutual_fund">Mutual Funds</option>
                  <option value="unlisted_stock">Unlisted</option>
                  <option value="bond">Bonds</option>
                  <option value="insurance">Insurance</option>
                  <option value="fd">FDs</option>
                  <option value="llp_capital">LLP Capital</option>
                  <option value="llp_loan">Loan to LLP &amp; Company</option>
                </select>
                <select 
                  className="form-select toolbar-sort-select" 
                  value={sortConfig.key === 'priority' ? 'priority' : `${sortConfig.key}-${sortConfig.direction}`}
                  onChange={e => handleSort(e.target.value)}
                >
                  <option value="priority">Sort: Default</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="invested-desc">Invested (High-Low)</option>
                  <option value="invested-asc">Invested (Low-High)</option>
                  <option value="pnl-desc">P&L (High-Low)</option>
                  <option value="pnl-asc">P&L (Low-High)</option>
                  <option value="current-desc">Value (High-Low)</option>
                  <option value="current-asc">Value (Low-High)</option>
                </select>
                <div className="search-wrapper">
                  <input
                    type="text"
                    placeholder="Search investments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-input search-input-field toolbar-search-input"
                  />
                  {searchQuery && (
                    <button className="search-clear" onClick={() => setSearchQuery('')} title="Clear search">×</button>
                  )}
                </div>
                <button
                  className="btn btn-ghost toolbar-btn"
                  onClick={handleExportCSV}
                >
                  📥 Export CSV
                </button>
                <button
                  className={`refresh-btn${refreshing ? ' spinning' : ''} toolbar-btn`}
                  onClick={() => fetchInvestments(true)}
                  disabled={refreshing}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M1 4v6h6M23 20v-6h-6" />
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                  </svg>
                  {refreshing ? 'Refreshing…' : 'Refresh Price'}
                </button>
                <button className="add-btn toolbar-btn" onClick={() => setShowModal(true)}>
                  + Add Investment
                </button>
              </div>
            </div>
          </div>

          <div className="investments-scroll-area">
            {/* Table */}
            <InvestmentTable
              investments={filtered.filter(i => i.type === 'stock' || i.type === 'mutual_fund')}
              livePrices={livePrices}
              mfNavs={mfNavs}
              loading={loading}
              onEdit={setEditingInvestment}
              onDelete={handleDelete}
            />
          </div>
        </div>

        {/* Other Investments Section — all non-live types */}
        {(() => {
          const NON_LIVE_TYPES = ['unlisted_stock', 'bond', 'insurance', 'fd', 'llp_capital', 'llp_loan'];
          const nonLive = filtered.filter(i => NON_LIVE_TYPES.includes(i.type));
          if (nonLive.length === 0) return null;
          return (
            <div className="investments-box-container" style={{ marginTop: '2rem' }}>
              <div className="sticky-section-header">
                <div className="section-row" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="section-title">Other Investments</span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {nonLive.length} entries
                    </span>
                  </div>
                </div>
              </div>
              <div className="investments-scroll-area">
                <InvestmentTable
                  investments={nonLive}
                  livePrices={livePrices}
                  mfNavs={mfNavs}
                  loading={loading}
                  onEdit={setEditingInvestment}
                  onDelete={handleDelete}
                />
              </div>
            </div>
          );
        })()}
      </main>

      {/* ── Modal ── */}
      {showModal && <AddInvestmentModal onAdd={handleAdd} onClose={() => setShowModal(false)} />}
      {editingInvestment && <EditInvestmentModal investment={editingInvestment} onEdit={handleEdit} onClose={() => setEditingInvestment(null)} />}

      {/* ── Toast ── */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}
    </div>
  );
}
