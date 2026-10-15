// The one-transaction profile read (U1 worker-area, R2.1, L2 step 1, NFR pattern P1).
// Everything the profile body, the completion flags and the requirement groups need,
// read inside one ReadCommitted transaction with a 5 s statement timeout: the
// profile by `userId` (the ownership lookup of L1 folded in, P7), its sections, the
// HOME row with its suburb, and the catalogue rows for the worker's services --
// the same selection today's app functions make (completion-today.md), so the
// completion rules see the rows they were written against. Prisma nested selects;
// no raw SQL beyond the literal SET LOCAL (T3). One connection, at most 5 s.
import { Prisma, readTransaction, type Db, type Tx } from '../../../platform/persistence/db'

/** R2.1: the statement timeout of the read, a constant (never input). */
export const PROFILE_READ_STATEMENT_TIMEOUT_MS = 5000

const DOC = { select: { id: true, name: true, category: true } } as const

const PROFILE_SELECT = {
  id: true,
  userId: true,
  firstName: true,
  middleName: true,
  lastName: true,
  mobile: true,
  photos: true,
  introduction: true,
  city: true,
  state: true,
  postalCode: true,
  age: true,
  dateOfBirth: true,
  gender: true,
  hasVehicle: true,
  languages: true,
  abn: true,
  setupProgress: true,
  profileCompleted: true,
  verificationStatus: true,
  isPublished: true,
  updatedAt: true,
  homeStreetLine: true,
  homeLocality: { select: { id: true, suburb: true, state: true, postcode: true } },
  workerServices: { select: { categoryId: true, categoryName: true, subcategoryIds: true, subcategoryNames: true, metadata: true, createdAt: true }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
  verificationRequirements: { select: { id: true, requirementType: true, requirementName: true, status: true, documentCategory: true, documentUrl: true, expiresAt: true } },
  availability: { select: { dayOfWeek: true, startMinute: true, endMinute: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
  careExperience: { select: { domain: true, isProfessional: true, isPersonal: true, specificAreas: true, otherAreas: true, description: true }, orderBy: { domain: 'asc' } },
  jobHistoryEntries: { select: { id: true, jobTitle: true, company: true, startMonth: true, startYear: true, endMonth: true, endYear: true, currentlyWorking: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
  educationEntries: { select: { id: true, institution: true, qualification: true, startMonth: true, startYear: true, endMonth: true, endYear: true, currentlyStudying: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
  workerAdditionalInfo: {
    select: { languages: true, culturalBackground: true, religion: true, interests: true, workPreferences: true, lgbtqiaSupport: true, nonSmoker: true, petFriendly: true, personality: true, uniqueService: true, funFact: true, bankAccount: true },
  },
  locations: { where: { kind: 'HOME' }, select: { localityId: true, travelRadiusKm: true, precision: true, locality: { select: { suburb: true, state: true, postcode: true } } }, take: 1 },
} satisfies Prisma.WorkerProfileSelect

const CATALOGUE_SELECT = {
  id: true,
  name: true,
  documents: { select: { documentType: true, conditionKey: true, requiredIfTrue: true, document: DOC }, orderBy: { createdAt: 'asc' } },
  subcategories: { select: { id: true, name: true, additionalDocuments: { select: { document: DOC }, orderBy: { createdAt: 'asc' } } }, orderBy: { id: 'asc' } },
} satisfies Prisma.CategorySelect

export type ProfileRecord = Prisma.WorkerProfileGetPayload<{ select: typeof PROFILE_SELECT }>
export type CatalogueRecord = Prisma.CategoryGetPayload<{ select: typeof CATALOGUE_SELECT }>

export interface ProfileRows {
  profile: ProfileRecord
  catalogue: CatalogueRecord[]
}

/** Today's service strings -> category ids / names and sub-category ids / names (completion-today.md, "compliance" step 2). */
export function catalogueFilter(services: readonly { categoryId: string; categoryName: string; subcategoryIds: readonly string[]; subcategoryNames: readonly string[] }[]) {
  const slug = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '-')
  const categoryIds = new Set<string>()
  const categoryNames = new Set<string>()
  const subIds = new Set<string>()
  const subNames = new Set<string>()
  for (const s of services) {
    categoryIds.add(s.categoryId)
    categoryIds.add(slug(s.categoryName))
    categoryNames.add(s.categoryName.trim())
    for (const id of s.subcategoryIds) subIds.add(id)
    for (const n of s.subcategoryNames) {
      subIds.add(slug(n))
      subNames.add(n.trim())
    }
  }
  return { categoryIds: [...categoryIds], categoryNames: [...categoryNames], subIds: [...subIds], subNames: [...subNames] }
}

/**
 * L1 + L2 step 1. `null` when the principal has no profile (R1.2). Runs
 * `recordDbSuccess` on commit through readTransaction (P4).
 */
export async function readProfileRows(db: Db, userId: string): Promise<ProfileRows | null> {
  return readTransaction(db, PROFILE_READ_STATEMENT_TIMEOUT_MS, (tx) => readProfileRowsTx(tx, userId))
}

/** The same rows inside a caller's transaction (a section write recomputing completion, U2 L1). */
export async function readProfileRowsTx(tx: Tx, userId: string): Promise<ProfileRows | null> {
  {
    // 'join' (relationJoins, the api's client only): the profile and every relation in one statement, not one per relation.
    const profile = await tx.workerProfile.findUnique({ where: { userId }, select: PROFILE_SELECT, relationLoadStrategy: 'join' })
    if (!profile) return null
    if (profile.workerServices.length === 0) return { profile, catalogue: [] }
    const f = catalogueFilter(profile.workerServices)
    // As today: with no sub-category chosen, every sub-category of the matched categories is read (U3 revisits).
    const catalogue = await tx.category.findMany({
      relationLoadStrategy: 'join',
      where: { OR: [{ id: { in: f.categoryIds } }, { name: { in: f.categoryNames } }] },
      select: {
        ...CATALOGUE_SELECT,
        subcategories: { ...CATALOGUE_SELECT.subcategories, where: f.subIds.length > 0 || f.subNames.length > 0 ? { OR: [{ id: { in: f.subIds } }, { name: { in: f.subNames } }] } : undefined },
      },
      orderBy: { id: 'asc' },
    })
    return { profile, catalogue }
  }
}

/**
 * The same selection as readProfileRows's catalogue query, applied in memory to the whole
 * catalogue: the categories matched by id or name, and -- as today -- their chosen
 * sub-categories, or every sub-category when none is chosen. Pure; used by the page read.
 */
export function selectCatalogueFor(all: readonly CatalogueRecord[], services: readonly { categoryId: string; categoryName: string; subcategoryIds: readonly string[]; subcategoryNames: readonly string[] }[]): CatalogueRecord[] {
  if (services.length === 0) return []
  const f = catalogueFilter(services)
  const ids = new Set(f.categoryIds)
  const names = new Set(f.categoryNames)
  const subIds = new Set(f.subIds)
  const subNames = new Set(f.subNames)
  const filterSubs = subIds.size > 0 || subNames.size > 0
  return all
    .filter((c) => ids.has(c.id) || names.has(c.name))
    .map((c) => ({ ...c, subcategories: filterSubs ? c.subcategories.filter((s) => subIds.has(s.id) || subNames.has(s.name)) : c.subcategories }))
}

/**
 * A page of profiles with the same rows as readProfileRows, in one transaction: the
 * page's profiles with their relations (one statement per relation for the whole page,
 * none per row) and the catalogue once, selected per worker in memory. For the backfill
 * (U1 worker-area, P14): one transaction per worker from a machine far from the database
 * is a round trip per statement, hours for the whole table; a page is seconds.
 */
export const PAGE_READ_STATEMENT_TIMEOUT_MS = 15_000
export const PAGE_READ_TRANSACTION_TIMEOUT_MS = 90_000

export async function readProfileRowsPage(db: Db, afterId: string, take: number): Promise<ProfileRows[]> {
  return readTransaction(
    db,
    PAGE_READ_STATEMENT_TIMEOUT_MS,
    async (tx) => {
    const profiles = await tx.workerProfile.findMany({ where: { id: { gt: afterId } }, orderBy: { id: 'asc' }, take, select: PROFILE_SELECT, relationLoadStrategy: 'join' })
    if (profiles.length === 0) return []
    const anyServices = profiles.some((p) => p.workerServices.length > 0)
    const all = anyServices ? await tx.category.findMany({ select: CATALOGUE_SELECT, orderBy: { id: 'asc' }, relationLoadStrategy: 'join' }) : []
    return profiles.map((profile) => ({ profile, catalogue: selectCatalogueFor(all, profile.workerServices) }))
    },
    { transactionTimeoutMs: PAGE_READ_TRANSACTION_TIMEOUT_MS },
  )
}
