'use client';
import React, { useEffect, useState } from 'react';

const MARKET_INDICES = ['^BSESN', '^NSEI'];
const INDEX_LABELS: Record<string, string> = {
  '^BSESN': 'SENSEX',
  '^NSEI': 'NIFTY 50'
};

export default function MarketIndexHeader() {
  const [indexData, setIndexData] = useState<Record<string, { price: number; change: number | null; percent: number | null } | null>>({});

  useEffect(() => {
    async function fetchIndices() {
      try {
        const res = await fetch(`/api/prices?tickers=${MARKET_INDICES.join(',')}`);
        const data = await res.json();
        setIndexData(data);
      } catch (err) {
        console.error('Failed to fetch indices for header', err);
      }
    }
    fetchIndices();
    const interval = setInterval(fetchIndices, 60000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="indices-container">
      {MARKET_INDICES.map(ticker => {
        const data = indexData[ticker];
        if (!data) return null;
        const isPos = (data.percent || 0) >= 0;
        const color = isPos ? 'var(--green)' : 'var(--red)';
        
        return (
          <div key={ticker} className="index-item">
            <span className="index-label">
              {INDEX_LABELS[ticker]}
            </span>
            <div className="index-value-row">
              <span className="index-price">
                {data.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
              {(data.change !== null || data.percent !== null) && (
                <div className="index-change-group" style={{ color }}>
                  <span>{isPos ? '▲' : '▼'}</span>
                  <span>
                    {data.change !== null && Math.abs(data.change).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                  <span style={{ opacity: 0.8, fontSize: '0.9em' }}>
                    ({data.percent !== null && Math.abs(data.percent).toFixed(2)}%)
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
