import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/contractors-by-area?state=NSW
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')

    // If no state specified, return all unique states
    if (!state) {
      const allContractors = await prisma.contractorsbyArea.findMany({
        select: {
          suburbState: true,
        },
      })

      // Extract unique states from suburbState (e.g., "Sydney, NSW" -> "NSW")
      const statesSet = new Set<string>()
      allContractors.forEach(item => {
        // Extract state from "City, STATE" format
        const parts = item.suburbState.split(',')
        if (parts.length > 1) {
          const extractedState = parts[parts.length - 1].trim()
          statesSet.add(extractedState)
        }
      })

      const uniqueStates = Array.from(statesSet).sort()

      return NextResponse.json({
        success: true,
        states: uniqueStates,
      })
    }

    // Fetch contractors for specific state (filter by state part of suburbState)
    const allContractors = await prisma.contractorsbyArea.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Filter contractors where suburbState ends with the state
    const contractors = allContractors.filter(contractor => {
      const parts = contractor.suburbState.split(',')
      if (parts.length > 1) {
        const extractedState = parts[parts.length - 1].trim()
        return extractedState.toLowerCase() === state.toLowerCase()
      }
      return false
    })

    // Count total contractors for this state
    const count = contractors.length

    return NextResponse.json({
      success: true,
      state,
      count,
      contractors,
    })
  } catch (error) {
    console.error('Error fetching contractors by state:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch contractors',
      },
      { status: 500 }
    )
  }
}
