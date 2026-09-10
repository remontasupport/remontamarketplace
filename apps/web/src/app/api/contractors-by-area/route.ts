import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Maps abbreviation -> all known variants stored in the DB
const STATE_ALIASES: Record<string, string[]> = {
  NSW: ['NSW', 'New South Wales'],
  VIC: ['VIC', 'Victoria', 'Vic'],
  QLD: ['QLD', 'Queensland', 'Qld'],
  SA:  ['SA',  'South Australia'],
  WA:  ['WA',  'Western Australia'],
  TAS: ['TAS', 'Tasmania'],
  NT:  ['NT',  'Northern Territory'],
  ACT: ['ACT', 'Australian Capital Territory'],
}

// Normalise any DB value back to an abbreviation
function normaliseState(raw: string): string | null {
  for (const [abbr, aliases] of Object.entries(STATE_ALIASES)) {
    if (aliases.some(a => a.toLowerCase() === raw.toLowerCase())) return abbr
  }
  return null
}

// GET /api/contractors-by-area?state=SA
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')

    if (!state) {
      // Return the unique normalised states that have active workers
      const rows = await prisma.contractorProfile.findMany({
        where: { deletedAt: null, state: { not: null } },
        select: { state: true },
      })

      const seen = new Set<string>()
      rows.forEach(r => {
        const abbr = normaliseState(r.state!)
        if (abbr) seen.add(abbr)
      })

      return NextResponse.json({ success: true, states: Array.from(seen).sort() })
    }

    const aliases = STATE_ALIASES[state.toUpperCase()] ?? [state]

    const profiles = await prisma.contractorProfile.findMany({
      where: {
        deletedAt: null,
        state: { in: aliases, mode: 'insensitive' },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        city: true,
        state: true,
        aboutYou: true,
        profilePicture: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const contractors = profiles.map(p => ({
      id: p.id,
      workerName: `${p.firstName} ${p.lastName}`.trim(),
      suburbState: [p.city, normaliseState(p.state!) ?? p.state].filter(Boolean).join(', '),
      image: p.profilePicture ?? null,
      bio: p.aboutYou ?? null,
    }))

    return NextResponse.json({
      success: true,
      state: state.toUpperCase(),
      count: contractors.length,
      contractors,
    })
  } catch (error) {
    console.error('Error fetching contractors by state:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contractors' },
      { status: 500 }
    )
  }
}
