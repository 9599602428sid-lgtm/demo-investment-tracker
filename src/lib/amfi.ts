
export interface AmfiData {
  schemeCode: string;
  schemeName: string;
  nav: number;
  date: string;
  isin?: string;
}

let amfiCache: Map<string, AmfiData> | null = null;
let lastUpdate = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

async function fetchAmfiData(): Promise<Map<string, AmfiData>> {
  const now = Date.now();
  if (amfiCache && (now - lastUpdate < CACHE_DURATION)) {
    return amfiCache;
  }

  try {
    const response = await fetch('https://www.amfiindia.com/spages/NAVAll.txt', {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) throw new Error('Failed to fetch AMFI data');

    const text = await response.text();
    const lines = text.split('\n');
    const newCache = new Map<string, AmfiData>();

    for (const line of lines) {
      if (!line.trim() || !line.includes(';')) continue;

      const parts = line.split(';');
      if (parts.length < 5) continue;

      const schemeCode = parts[0].trim();
      const isin = parts[1].trim();
      const schemeName = parts[3].trim();
      const navStr = parts[4].trim();
      const date = parts[5]?.trim();

      const nav = parseFloat(navStr);
      if (!isNaN(nav) && schemeCode) {
        newCache.set(schemeCode, {
          schemeCode,
          schemeName,
          nav,
          date,
          isin
        });
      }
    }

    amfiCache = newCache;
    lastUpdate = now;
    return newCache;
  } catch (error) {
    console.error('Error fetching AMFI data:', error);
    return amfiCache || new Map();
  }
}

export async function getAmfiNav(schemeCode: string): Promise<number | null> {
  const data = await fetchAmfiData();
  return data.get(schemeCode)?.nav ?? null;
}

export async function getMultiAmfiNav(schemeCodes: string[]): Promise<Record<string, number | null>> {
  const data = await fetchAmfiData();
  const result: Record<string, number | null> = {};
  for (const code of schemeCodes) {
    result[code] = data.get(code)?.nav ?? null;
  }
  return result;
}

export async function searchAmfiFunds(query: string): Promise<AmfiData[]> {
  const data = await fetchAmfiData();
  const q = query.toLowerCase();
  const results: AmfiData[] = [];
  
  for (const item of data.values()) {
    if (item.schemeName.toLowerCase().includes(q) || item.schemeCode.includes(q)) {
      results.push(item);
      if (results.length >= 10) break;
    }
  }
  
  return results;
}
