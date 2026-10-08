// GET /api/auth/api-token: a five-minute token for apps/api, minted from the
// NextAuth session (U1 api-identity, C11). The logic is in lib/api/mint.ts; this
// file only binds the session, the users table (through withRetry), the strict
// limiter and the secret. Answers are never cached (no-store); no cookie is set.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { authPrisma, withRetry } from '@/lib/auth-prisma'
import { checkServerActionRateLimit, strictApiRateLimit } from '@/lib/ratelimit'
import { mintApiToken } from '@/lib/api/mint'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  const result = await mintApiToken({
    session: session?.user?.id ? { user: { id: session.user.id, role: session.user.role, impersonatedBy: session.user.impersonatedBy } } : null,
    readAccount: (userId) => withRetry(() => authPrisma.user.findUnique({ where: { id: userId }, select: { status: true, role: true } })),
    rateLimit: (userId) => checkServerActionRateLimit(userId, strictApiRateLimit),
    secret: process.env.API_TOKEN_SECRET,
  })
  return NextResponse.json(result.body, { status: result.status, headers: result.headers })
}
