'use client';
import React from 'react';
import { Investment } from '@/lib/supabase';

interface Props {
  investments: Investment[];
  livePrices: Record<string, { price: number; change: number | null; percent: number | null } | null>;
  mfNavs: Record<string, number | null>;
}

export default function StockTicker({ investments, livePrices, mfNavs }: Props) {
  // Get unique stocks and mutual funds
  const stocks = Array.from(new Set(
    investments.filter(i => i.type === 'stock' && i.ticker).map(i => i.ticker!)
  ));
  
  const mfs = Array.from(new Set(
    investments.filter(i => i.type === 'mutual_fund' && i.scheme_code).map(i => i.scheme_code!)
  ));

  const stockItems = stocks.map(ticker => {
    const data = livePrices[ticker];
    return {
      symbol: ticker.replace('.NS', '').replace('.BO', ''),
      price: data?.price || 0,
      percent: data?.percent || null,
      type: 'Stock'
    };
  }).filter(s => s.price > 0);

  const mfItems = mfs.map(code => {
    const inv = investments.find(i => i.scheme_code === code);
    return {
      symbol: inv?.name.split(' ').slice(0, 3).join(' ') || code,
      price: mfNavs[code] || 0,
      percent: null,
      type: 'MF'
    };
  }).filter(s => s.price > 0);

  const combined = [...stockItems, ...mfItems];
  if (combined.length === 0) return null;

  // Duplicate for seamless marquee
  let items = combined;
  if (items.length < 10) {
    items = [...combined, ...combined, ...combined, ...combined];
  } else {
    items = [...combined, ...combined];
  }

  return (
    <div className="ticker-wrap" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <div className="ticker-move" style={{ animationDuration: `${Math.max(15, items.length * 4)}s` }}>
        {items.map((item, i) => {
          const isPos = (item.percent || 0) >= 0;
          return (
            <div key={`${item.symbol}-${i}`} className="ticker-item">
              <span style={{ fontSize: '10px', color: 'var(--text-3)', marginRight: '6px', textTransform: 'uppercase' }}>
                {item.type}
              </span>
              <b>{item.symbol}</b>
              <i className="ticker-up" style={{ color: item.percent !== null ? (isPos ? 'var(--green)' : 'var(--red)') : 'var(--text-1)' }}>
                ₹{item.price.toLocaleString('en-IN', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
                {item.percent !== null && (
                  <span style={{ fontSize: '11px', marginLeft: '6px' }}>
                    ({isPos ? '+' : ''}{item.percent.toFixed(2)}%)
                  </span>
                )}
              </i>
            </div>
          );
        })}
      </div>
    </div>
  );
}
