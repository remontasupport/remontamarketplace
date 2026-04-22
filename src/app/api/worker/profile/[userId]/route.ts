import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { authPrisma } from '@/lib/auth-prisma'
import { getOrFetch, CACHE_KEYS, CACHE_TTL } from '@/lib/redis'
import { getAllCompletionStatusOptimized } from '@/services/worker/setupProgress.service'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Single DB call: profile + workerServices + verificationRequirements */
async function fetchProfileBase(userId: string) {
  return authPrisma.workerProfile.findUnique({
    where: { userId },
    select: {
      id: true, firstName: true, middleName: true, lastName: true,
      mobile: true, location: true, city: true, state: true, postalCode: true,
      photos: true, additionalPhotos: true, introduction: true, age: true, dateOfBirth: true,
      gender: true, hasVehicle: true, abn: true, profileCompleted: true,
      isPublished: true, verificationStatus: true, setupProgress: true,
      workerServices: {
        select: { categoryName: true, subcategoryIds: true, subcategoryNames: true },
        orderBy: { createdAt: 'asc' },
      },
      verificationRequirements: {
        select: {
          id: true, requirementType: true, requirementName: true,
          documentUrl: true, documentUploadedAt: true, createdAt: true, metadata: true,
        },
      },
    },
  })
}

type ProfileBase = NonNullable<Awaited<ReturnType<typeof fetchProfileBase>>>

/** Transform raw profile data into API response shape */
function transformProfile(profile: ProfileBase) {
  const { workerServices, verificationRequirements, ...baseProfile } = profile

  const services = workerServices.map(ws => ws.categoryName)
  const supportWorkerCategories = workerServices.flatMap(ws => ws.subcategoryIds)

  const firstService = workerServices[0]
  const displayRole =
    firstService?.categoryName === 'Therapeutic Supports' && firstService.subcategoryNames.length > 0
      ? firstService.subcategoryNames.join(' / ')
      : firstService?.categoryName ?? 'Support Worker'

  const documentsByService: Record<string, Record<string, string[]>> = {}
  for (const req of verificationRequirements) {
    const meta = req.metadata as any
    if (meta?.serviceTitle && meta?.documentUrls?.length > 0) {
      documentsByService[meta.serviceTitle] ??= {}
      documentsByService[meta.serviceTitle][req.requirementType] = meta.documentUrls
    }
  }

  return { ...baseProfile, services, supportWorkerCategories, displayRole, documentsByService, verificationRequirements }
}

// ─── Route handler ────────────────────────────────────────────────────────────

/**
 * GET /api/worker/profile/[userId]
 *
 * Performance:
 * - Base profile (1 merged DB query) cached for 1 min
 * - Completion status (1 optimized DB query for all 4 checks) cached for 1 min
 *   using the same cache key as the dashboard page → shared warm-up
 * - Both run in parallel via Promise.all
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    // Parallel: base profile (cached) + all completion checks in 1 DB query (cached)
    // Shares CACHE_KEYS.completionStatus with dashboard page — first load warms both
    const [profileBase, completionResult] = await Promise.all([
      getOrFetch(CACHE_KEYS.workerProfileBase(userId), () => fetchProfileBase(userId), CACHE_TTL.WORKER_PROFILE_BASE),
      getOrFetch(CACHE_KEYS.completionStatus(userId), () => getAllCompletionStatusOptimized(userId), CACHE_TTL.COMPLETION_STATUS),
    ])

    if (!profileBase) return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 })

    const setupProgress = {
      accountDetails: completionResult.success ? (completionResult.data?.accountDetails ?? false) : false,
      compliance: completionResult.success ? (completionResult.data?.compliance ?? false) : false,
      trainings: completionResult.success ? (completionResult.data?.trainings ?? false) : false,
      services: completionResult.success ? (completionResult.data?.services ?? false) : false,
      additionalCredentials: false,
    }

    return NextResponse.json({ ...transformProfile(profileBase), setupProgress })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    )
  }
}
