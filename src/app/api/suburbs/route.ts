import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const response = await fetch(
      `https://v0.postcodeapi.com.au/suburbs.json?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('PostcodeAPI error:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to fetch suburbs' }, { status: response.status });
    }

    const data = await response.json();

    // Return the data (limit to 10 results)
    return NextResponse.json(Array.isArray(data) ? data.slice(0, 10) : []);
  } catch (error) {
    console.error('Error fetching suburbs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
