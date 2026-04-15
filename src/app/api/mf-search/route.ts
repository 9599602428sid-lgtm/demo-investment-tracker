import { NextRequest, NextResponse } from 'next/server';

// Search Indian mutual funds via mfapi.in
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  if (!q || q.length < 2) return NextResponse.json([]);

  try {
    const { searchAmfiFunds } = require('@/lib/amfi');
    const funds = await searchAmfiFunds(q);
    
    // Map to expected format
    const results = funds.map((f: any) => ({
      schemeCode: Number(f.schemeCode),
      schemeName: f.schemeName,
      price: f.nav
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json([]);
  }
}
