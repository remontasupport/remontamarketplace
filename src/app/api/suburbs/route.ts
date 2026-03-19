import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''

  if (!q.trim()) {
    return NextResponse.json([])
  }

  const res = await fetch(`https://app.remontaservices.com.au/api/suburbs?q=${encodeURIComponent(q)}`)
  const data = await res.json()

  return NextResponse.json(data)
}
