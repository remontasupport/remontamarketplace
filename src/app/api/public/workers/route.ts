import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const params = new URLSearchParams()

  const location = searchParams.get('location')
  const typeOfSupport = searchParams.get('typeOfSupport')
  const within = searchParams.get('within')
  const page = searchParams.get('page') ?? '1'

  if (location) params.set('location', location)
  if (typeOfSupport) params.set('typeOfSupport', typeOfSupport)
  if (within) params.set('within', within)
  params.set('page', page)

  const res = await fetch(`${process.env.REMONTA_API_URL}/api/public/workers?${params}`)
  const data = await res.json()

  return NextResponse.json(data)
}
