import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { authPrisma, withRetry } from '@/lib/auth-prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ count: 0 }, { status: 401 })
  }

  type CountRow = { count: bigint }
  const rows = await withRetry(() =>
    authPrisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) as count
      FROM service_requests sr
      WHERE sr."requesterId" = ${session.user.id}
        AND sr.status = 'COMPLETED'::"ServiceRequestStatus"
        AND (sr.details->>'_hidden' IS NULL OR sr.details->>'_hidden' != 'true')
    `
  )

  const count = Number(rows[0]?.count ?? 0)
  return NextResponse.json({ count })
}
