import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

// Fetch latest NAV for a single mutual fund scheme
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const codes = req.nextUrl.searchParams.get('codes') || '';
  if (!codes) return NextResponse.json({});

  const codeList = codes.split(',').map(c => c.trim()).filter(Boolean);
  
  const { getMultiAmfiNav } = require('@/lib/amfi');
  const result = await getMultiAmfiNav(codeList);

  return NextResponse.json(result);
}
