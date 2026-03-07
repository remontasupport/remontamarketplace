/**
 * Worker Requirements API
 * GET /api/worker/requirements
 * GET /api/worker/requirements?services=s1,s2
 * GET /api/worker/requirements?serviceName=Name
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { authPrisma } from '@/lib/auth-prisma'
import { prisma } from '@/lib/prisma'
import { getOrFetch, CACHE_KEYS, CACHE_TTL } from '@/lib/redis'

// ─── Static constants ────────────────────────────────────────────────────────

const CATEGORY_TO_GROUP = new Map([
  ['IDENTITY', 'baseCompliance'], ['BUSINESS', 'baseCompliance'], ['COMPLIANCE', 'baseCompliance'],
  ['TRAINING', 'trainings'], ['QUALIFICATION', 'qualifications'], ['REGISTRATION', 'qualifications'],
  ['INSURANCE', 'insurance'], ['TRANSPORT', 'transport'],
])

const CODE_OF_CONDUCT_STEPS = [
  { id: 'code-of-conduct-part1', name: 'Code of Conduct (Part 1)', category: 'COMPLIANCE', description: 'Read and understand the Remonta Code of Conduct - Part 1 of 2', hasExpiration: false, documentType: 'REQUIRED', serviceCategory: 'All Services' },
  { id: 'code-of-conduct-part2', name: 'Code of Conduct (Part 2)', category: 'COMPLIANCE', description: 'Read, sign and acknowledge the Remonta Code of Conduct - Part 2 of 2', hasExpiration: false, documentType: 'REQUIRED', serviceCategory: 'All Services' },
]

const EMPTY_REQUIREMENTS = { baseCompliance: [], trainings: [], qualifications: [], insurance: [], transport: [] }

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Single DB call: profile id + worker services */
async function getWorkerServiceStrings(userId: string, serviceNameFilter?: string | null): Promise<string[] | null> {
  const profile = await authPrisma.workerProfile.findUnique({
    where: { userId },
    select: {
      workerServices: {
        where: serviceNameFilter ? { categoryName: serviceNameFilter } : undefined,
        select: { categoryName: true, subcategoryNames: true },
      },
    },
  })
  if (!profile) return null
  return profile.workerServices.flatMap(ws =>
    ws.subcategoryNames.length > 0
      ? ws.subcategoryNames.map(sub => `${ws.categoryName}:${sub}`)
      : [ws.categoryName]
  )
}

/** Parse service strings into unique category/subcategory sets for DB queries */
function parseServiceSets(services: string[]) {
  const parsed = services.map(s => {
    const [cat, sub] = s.split(':').map(p => p.trim())
    return {
      categoryId: cat.toLowerCase().replace(/\s+/g, '-'),
      categoryName: cat,
      subcategoryId: sub ? sub.toLowerCase().replace(/\s+/g, '-') : null,
      subcategoryName: sub ?? null,
    }
  })
  return {
    categoryIds: [...new Set(parsed.map(p => p.categoryId))],
    categoryNames: [...new Set(parsed.map(p => p.categoryName))],
    subIds: [...new Set(parsed.map(p => p.subcategoryId).filter((x): x is string => x !== null))],
    subNames: [...new Set(parsed.map(p => p.subcategoryName).filter((x): x is string => x !== null))],
  }
}

/** Group + deduplicate requirements by category type */
function groupRequirements(allRequirements: any[]) {
  const groups = new Map<string, Map<string, any>>()
  for (const req of allRequirements) {
    const groupName = CATEGORY_TO_GROUP.get(req.category)
    if (!groupName) continue
    if (!groups.has(groupName)) groups.set(groupName, new Map())
    const group = groups.get(groupName)!
    if (!group.has(req.id)) group.set(req.id, req)
  }
  return {
    baseCompliance: Array.from(groups.get('baseCompliance')?.values() ?? []),
    trainings: Array.from(groups.get('trainings')?.values() ?? []),
    qualifications: Array.from(groups.get('qualifications')?.values() ?? []),
    insurance: Array.from(groups.get('insurance')?.values() ?? []),
    transport: Array.from(groups.get('transport')?.values() ?? []),
  }
}

/** Core builder — fetches categories and produces the full response shape */
async function buildRequirementsResponse(userId: string, servicesParam: string | null, serviceNameParam: string | null) {
  // Resolve services list
  let servicesToFetch: string[]
  if (servicesParam) {
    servicesToFetch = servicesParam.split(',').map(s => s.trim()).filter(Boolean)
  } else {
    const services = await getWorkerServiceStrings(userId, serviceNameParam)
    if (services === null) return null // profile not found
    servicesToFetch = services
  }

  if (servicesToFetch.length === 0) {
    return { success: true, services: [], requirements: EMPTY_REQUIREMENTS }
  }

  const { categoryIds, categoryNames, subIds, subNames } = parseServiceSets(servicesToFetch)

  const categories = await prisma.category.findMany({
    where: { OR: [{ id: { in: categoryIds } }, { name: { in: categoryNames } }] },
    select: {
      id: true, name: true,
      documents: {
        select: {
          documentType: true, conditionKey: true, requiredIfTrue: true,
          document: { select: { id: true, name: true, category: true, description: true, hasExpiration: true } },
        },
      },
      subcategories: {
        where: subIds.length > 0 || subNames.length > 0
          ? { OR: [{ id: { in: subIds } }, { name: { in: subNames } }] }
          : undefined,
        select: {
          name: true,
          additionalDocuments: {
            select: { document: { select: { id: true, name: true, category: true, description: true, hasExpiration: true } } },
          },
        },
      },
    },
  })

  const allRequirements = [
    ...categories.flatMap(cat => cat.documents.map(cd => ({
      id: cd.document.id, name: cd.document.name, category: cd.document.category,
      description: cd.document.description, hasExpiration: cd.document.hasExpiration,
      documentType: cd.documentType, serviceCategory: cat.name,
      conditionKey: cd.conditionKey, requiredIfTrue: cd.requiredIfTrue,
    }))),
    ...categories.flatMap(cat => cat.subcategories.flatMap(sub =>
      sub.additionalDocuments.map(sd => ({
        id: sd.document.id, name: sd.document.name, category: sd.document.category,
        description: sd.document.description, hasExpiration: sd.document.hasExpiration,
        documentType: 'REQUIRED', serviceCategory: cat.name, subcategory: sub.name,
      }))
    )),
  ]

  const { baseCompliance, ...rest } = groupRequirements(allRequirements)

  // Insert Code of Conduct after ABN step (or at end)
  const abnIndex = baseCompliance.findIndex((d: any) => d.id === 'abn-contractor')
  if (abnIndex !== -1) baseCompliance.splice(abnIndex + 1, 0, ...CODE_OF_CONDUCT_STEPS)
  else baseCompliance.push(...CODE_OF_CONDUCT_STEPS)

  return { success: true, services: servicesToFetch, requirements: { baseCompliance, ...rest } }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const servicesParam = searchParams.get('services')
  const serviceNameParam = searchParams.get('serviceName')

  try {
    // Cache only the default (no-params) path — that's what the sidebar uses
    const data = !servicesParam && !serviceNameParam
      ? await getOrFetch(
          CACHE_KEYS.workerRequirements(session.user.id),
          () => buildRequirementsResponse(session.user.id, null, null),
          CACHE_TTL.WORKER_REQUIREMENTS
        )
      : await buildRequirementsResponse(session.user.id, servicesParam, serviceNameParam)

    if (!data) return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 })

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch requirements', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    )
  }
}
