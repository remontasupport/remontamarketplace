import { NextRequest, NextResponse } from 'next/server';
import { searchSuburbs } from '@/lib/suburbs';

// Suburb autocomplete (see lib/suburbs). Results depend only on `q`, so the CDN
// may cache them for an hour.
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') ?? '';
  try {
    const suburbs = await searchSuburbs(query);
    return NextResponse.json(suburbs, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
