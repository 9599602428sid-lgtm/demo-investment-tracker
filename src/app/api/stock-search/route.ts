import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  if (!q || q.trim().length < 2) return NextResponse.json([]);

  try {
    const res = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(3000)
    });

    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }

    const data = await res.json();
    
    const quotes = (data.quotes || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((r: any) => r.quoteType === 'EQUITY' || r.quoteType === 'ETF' || r.quoteType === 'MUTUALFUND')
      .slice(0, 8);
      
    const symbols = quotes.map((r: any) => r.symbol).filter(Boolean);
    
    let priceMap: Record<string, number> = {};
    if (symbols.length > 0) {
      try {
        const yfClass = require('yahoo-finance2').default;
        const yahooFinance = new yfClass();

        // Separate NSE stocks for a faster Groww fetch, use Yahoo for the rest
        await Promise.all(symbols.map(async (symbol: string) => {
          try {
            // Check if it's an Indian stock (NSE/BSE)
            if (symbol.endsWith('.NS') || symbol.endsWith('.BO')) {
              const baseSymbol = symbol.replace(/\.(NS|BO)$/i, '');
              const growwRes = await fetch(`https://groww.in/v1/api/stocks_data/v1/tr_live_prices/exchange/NSE/segment/CASH/${encodeURIComponent(baseSymbol)}/latest`, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                signal: AbortSignal.timeout(2000)
              });
              if (growwRes.ok) {
                const growwData = await growwRes.json();
                if (growwData?.ltp) {
                  priceMap[symbol] = growwData.ltp;
                  return;
                }
              }
            }

            // Fallback to Yahoo Finance for individual symbols if Groww fails or it's international
            const quoteData: any = await Promise.race([
              yahooFinance.quote(symbol),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
            ]);
            
            if (quoteData && quoteData.regularMarketPrice) {
              priceMap[symbol] = quoteData.regularMarketPrice;
            }
          } catch (e) {
            console.warn(`Failed to fetch price for ${symbol}`, e);
          }
        }));
      } catch (e) {
        console.warn('Failed to fetch secondary prices for search', e);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalResults = quotes.map((r: any) => ({
      symbol: r.symbol,
      shortname: r.shortname,
      longname: r.longname,
      exchange: r.exchange,
      price: priceMap[r.symbol] || null,
    }));
      
    return NextResponse.json(finalResults);
  } catch (err: any) {
    console.error('Yahoo Search Error:', err.message);
    return NextResponse.json([{ symbol: 'ERROR', shortname: err.message || 'Error occurred', exchange: 'SYS', price: null }]);
  }
}

