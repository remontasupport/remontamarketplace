/**
 * GET /api/geocode?q=Sydney
 *
 * Resolves a suburb/city name to an Australian state using
 * the Nominatim (OpenStreetMap) geocoding API.
 *
 * Used by the job search area filter so that typing "Sydney"
 * surfaces all jobs from New South Wales.
 *
 * Results are cached in-memory for 1 hour to stay well within
 * Nominatim's 1 req/sec fair-use limit.
 */

import { NextRequest, NextResponse } from 'next/server'

interface NominatimResult {
  address?: {
    state?: string
  }
}

// Simple in-memory cache — survives across requests in the same serverless instance
const cache = new Map<string, { state: string | null; ts: number }>()
const CACHE_TTL_MS = 1000 * 60 * 60 // 1 hour

export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ state: null })
  }

  const key = q.toLowerCase()

  // Return cached result if still fresh
  const cached = cache.get(key)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json({ state: cached.state })
  }

  try {
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(q + ', Australia')}` +
      `&format=json&limit=1&addressdetails=1&countrycodes=au`

    const res = await fetch(url, {
      headers: {
        // Nominatim requires a descriptive User-Agent
        'User-Agent': 'RemontaMarketplace/1.0 (community@remontaservices.com.au)',
        'Accept-Language': 'en-AU',
      },
    })

    if (!res.ok) {
      return NextResponse.json({ state: null })
    }

    const data: NominatimResult[] = await res.json()
    const state = data[0]?.address?.state ?? null

    cache.set(key, { state, ts: Date.now() })

    return NextResponse.json({ state })
  } catch {
    return NextResponse.json({ state: null })
  }
}
