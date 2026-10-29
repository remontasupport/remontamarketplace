import { NextRequest, NextResponse } from 'next/server'
import { createClient, registrationContract } from '@remonta/api-contract'

// Suburb suggestions for the marketing search bars, from apps/api (GET /v1/localities, au_localities) on the server:
// the api admits only the app's origin from a browser. The CDN keeps each answer an hour (the list changes twice a
// year), so repeated prefixes never reach the api. Shape kept for the callers: { name, postcode, state: { abbreviation } }.
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') ?? '').trim()
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (q.length < 2 || !baseUrl) return NextResponse.json([])

  try {
    const r = await createClient(registrationContract, { baseUrl }).searchLocalities({ query: { q } })
    if (!r.ok) return NextResponse.json([])
    const suburbs = r.body.localities.map((l) => ({ name: l.suburb, postcode: l.postcode, state: { abbreviation: l.state } }))
    return NextResponse.json(suburbs, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } })
  } catch {
    return NextResponse.json([])
  }
}
