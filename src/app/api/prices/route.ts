import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tickers = req.nextUrl.searchParams.get('tickers') || '';
  if (!tickers) return NextResponse.json({});

  const tickerList = tickers.split(',').map(t => t.trim()).filter(Boolean);
  const result: Record<string, { price: number; change: number | null; percent: number | null } | null> = {};

  // Import yahoo-finance2
  const yfClass = require('yahoo-finance2').default;
  const yahooFinance = new yfClass();

  await Promise.all(
    tickerList.map(async (ticker) => {
      try {
        let price: number | null = null;
        let change: number | null = null;
        let percent: number | null = null;

        // 1. Primary: Groww for Indian stocks (only for price)
        if (ticker.endsWith('.NS') || ticker.endsWith('.BO')) {
          try {
            const baseSymbol = ticker.replace(/\.(NS|BO)$/i, '');
            const res = await fetch(`https://groww.in/v1/api/stocks_data/v1/tr_live_prices/exchange/NSE/segment/CASH/${encodeURIComponent(baseSymbol)}/latest`, {
              headers: { 'User-Agent': 'Mozilla/5.0' },
              signal: AbortSignal.timeout(3000),
            });
            if (res.ok) {
              const data = await res.json();
              if (typeof data?.ltp === 'number') {
                price = data.ltp;
                percent = data.dayChangePerc || null;
                // calculate points if possible
                if (data.dayChange !== undefined) change = data.dayChange;
                else if (data.dayChangePerc !== undefined && data.ltp !== undefined) {
                   // points = ltp * (perc / (100 + perc)) or similar? Actually dayChange is usually absolute.
                   // If only perc is given: prev = ltp / (1 + perc/100) -> change = ltp - prev
                   const prev = data.ltp / (1 + (data.dayChangePerc / 100));
                   change = data.ltp - prev;
                }
              }
            }
          } catch (e) { /* fallback to yahoo */ }
        }

        // 2. Fallback/Index: Yahoo Finance (for price, change and percent)
        if (price === null || ticker.startsWith('^')) {
          const quote: any = await Promise.race([
            yahooFinance.quote(ticker),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
          ]);

          if (quote) {
            price = quote.regularMarketPrice ?? price;
            change = quote.regularMarketChange ?? change;
            percent = quote.regularMarketChangePercent ?? percent;
          }
        }

        // 3. Final calculation: Ensure points change is derived if missing but % is there
        if (price !== null && percent !== null && change === null) {
          // prev = price / (1 + percent/100)
          const prev = price / (1 + (percent / 100));
          change = price - prev;
        }

        result[ticker] = price !== null ? { price, change, percent } : null;
      } catch (err: any) {
        console.error(`Price fetch error for ${ticker}:`, err.message);
        result[ticker] = null;
      }
    })
  );

  return NextResponse.json(result);
}

