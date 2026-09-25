// Worker registration (S1-design 3.4, S1-data-model 4).
//
//   R1 no enumeration: a new and an existing email get the same 202 and body, and
//      the password is hashed in both branches so the timing is similar.
//   R2 truthful: the account is usable at once; the message says so.
//   R3 atomic: user, profile, services, HOME location, onboarding marker and its
//      first transition, the photo claim, the audit row and the outbox event commit
//      together or not at all.
//   R4 the photo is claimed once: a used or expired upload is refused.
//   R5 a browser retry after a commit lands in R1.
import { randomUUID } from 'node:crypto'
import { REGISTRATION_ACCEPTED_MESSAGE } from '@remonta/api-contract'
import type { WorkerRegistration } from '@remonta/schemas/schema/workerRegistrationSchema'
import type { FastifyBaseLogger } from 'fastify'
import type { AuditRecorder } from '../../../platform/audit'
import { ApiError } from '../../../platform/errors'
import { enqueue } from '../../../platform/outbox/outbox'
import { Prisma, unitOfWork, type Db, type Tx } from '../../../platform/persistence/db'
import type { PasswordHasher } from '../../../platform/security/password-hasher'
import { placeHome } from '../../locations/domain/home'
import { countsOf, deriveStage } from '../../onboarding/domain/stage'
import type { BreachCheck, BreachedPasswordChecker } from '../adapters/pwned-passwords'

export const PHOTO_CLAIM_WINDOW_HOURS = 24

export interface RegisterDeps {
  db: Db
  hasher: PasswordHasher
  breaches: BreachedPasswordChecker
  now?: () => Date
}

export interface RegisterContext {
  audit: AuditRecorder
  log: FastifyBaseLogger
  /** zohoLeadId as sent, before the schema dropped a malformed one. */
  rawZohoLeadId: unknown
}

export const ACCEPTED = { status: 202, body: { status: 'accepted', message: REGISTRATION_ACCEPTED_MESSAGE } } as const

/** Raised inside the transaction when a concurrent registration took the email. */
class EmailTaken extends Error {}

export async function registerWorker(input: WorkerRegistration, deps: RegisterDeps, ctx: RegisterContext) {
  const now = deps.now ?? (() => new Date())

  if (typeof ctx.rawZohoLeadId === 'string' && ctx.rawZohoLeadId.trim() !== '' && input.zohoLeadId === undefined) {
    ctx.log.warn('zohoLeadId was malformed and has been dropped; registration continues') // US-REG-04
  }

  // Checked for every email, before the email is looked up, so a refusal here says
  // nothing about whether an account exists.
  const breach = await deps.breaches.check(input.password)
  if (breach.status === 'breached') {
    throw new ApiError(400, 'breached password', { password: ['This password has appeared in a data breach. Please choose a different one.'] })
  }
  if (breach.status === 'unknown') ctx.log.warn({ reason: breach.reason }, 'breached-password check unavailable; accepted (Q2 = A)')

  const services = await resolveServices(deps.db, input.services, input.supportWorkerCategories ?? [])

  // R1: hash in both branches.
  const passwordHash = await deps.hasher.hash(input.password)

  const existing = await deps.db.user.findUnique({ where: { email: input.email }, select: { id: true } })
  if (existing) return existingAccount(existing.id, deps.db, ctx, now())

  try {
    await unitOfWork(deps.db, (tx) => createAccount(tx, input, passwordHash, services, breach, now(), ctx))
  } catch (err) {
    if (err instanceof EmailTaken) {
      const taken = await deps.db.user.findUniqueOrThrow({ where: { email: input.email }, select: { id: true } })
      return existingAccount(taken.id, deps.db, ctx, now())
    }
    throw err
  }
  return ACCEPTED
}

/** At most one "someone tried" notice per account in this window (S1-design 3.5). */
export const EXISTING_ACCOUNT_NOTICE_WINDOW_MS = 10 * 60_000

async function existingAccount(userId: string, db: Db, ctx: RegisterContext, now: Date) {
  ctx.audit.skip('email already registered: no account change')
  // Decided here, when queueing, rather than in the email handler: a handler that
  // counted before sending would lose the notice if the send failed and was
  // retried. The per-account lock makes simultaneous attempts queue one notice.
  await unitOfWork(db, async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'existing-account-notice:' + userId}))`
    const since = new Date(now.getTime() - EXISTING_ACCOUNT_NOTICE_WINDOW_MS)
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { createdAt: true } })
    // R5: seconds after the account was created, this is the browser retrying its own sign-up.
    if (user.createdAt > since) return
    const recent = await tx.$queryRaw<unknown[]>`
      SELECT 1 FROM outbox_events
       WHERE type = 'RegistrationAttemptOnExistingAccount' AND payload->>'userId' = ${userId} AND "createdAt" > ${since}
       LIMIT 1`
    if (recent.length === 0) await enqueue(tx, { type: 'RegistrationAttemptOnExistingAccount', payload: { userId } }, now)
  })
  return ACCEPTED
}

interface ResolvedService {
  categoryId: string
  categoryName: string
  subcategoryIds: string[]
  subcategoryNames: string[]
}

/** Every service must be a Category; every sub-category must belong to a chosen one. */
async function resolveServices(db: Db, serviceIds: string[], subIds: string[]): Promise<ResolvedService[]> {
  const categories = await db.category.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, name: true, subcategories: { select: { id: true, name: true } } },
  })
  const unknown = serviceIds.filter((id) => !categories.some((c) => c.id === id))
  if (unknown.length) throw new ApiError(400, `unknown services ${unknown.join(',')}`, { services: ['Please choose services from the list'] })

  const owner = new Map<string, { categoryId: string; name: string }>()
  for (const c of categories) for (const s of c.subcategories) owner.set(s.id, { categoryId: c.id, name: s.name })
  const stray = subIds.filter((id) => !owner.has(id))
  if (stray.length) {
    throw new ApiError(400, `sub-categories outside the chosen services ${stray.join(',')}`, {
      supportWorkerCategories: ['Please choose categories that belong to your selected services'],
    })
  }
  // In the order the worker chose them, as today.
  return serviceIds.map((id) => {
    const c = categories.find((x) => x.id === id)!
    const mine = subIds.filter((s) => owner.get(s)!.categoryId === id)
    return { categoryId: c.id, categoryName: c.name, subcategoryIds: mine, subcategoryNames: mine.map((s) => owner.get(s)!.name) }
  })
}

async function createAccount(tx: Tx, input: WorkerRegistration, passwordHash: string, services: ResolvedService[], breach: BreachCheck, now: Date, ctx: RegisterContext) {
  const locality = await tx.auLocality.findFirst({ where: { id: input.localityId, retiredAt: null } })
  if (!locality) throw new ApiError(400, `locality ${input.localityId} unknown or retired`, { localityId: ['Please choose your suburb from the list'] })
  const placed = placeHome(locality, 'REGISTRATION')
  if (!placed.ok) throw new ApiError(400, 'locality retired', { localityId: ['Please choose your suburb from the list'] })

  // R4: claim the staged photo before anything else is written.
  const since = new Date(now.getTime() - PHOTO_CLAIM_WINDOW_HOURS * 3_600_000)
  const claimed = await tx.$queryRaw<{ url: string }[]>`
    UPDATE registration_photo_uploads SET "claimedAt" = ${now}
     WHERE id = ${input.photoUploadId}::uuid AND "claimedAt" IS NULL AND "createdAt" > ${since}
    RETURNING url`
  const photoUrl = claimed[0]?.url
  if (!photoUrl) throw new ApiError(400, 'photo upload missing, used or expired', { photoUploadId: ['Please upload your photo again'] })

  let user: { id: string; workerProfile: { id: string } | null }
  try {
    user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: 'WORKER',
        status: 'ACTIVE',
        updatedAt: now,
        workerProfile: {
          create: {
            firstName: input.firstName,
            lastName: input.lastName,
            mobile: input.mobile,
            photos: photoUrl,
            // Legacy columns, dual-written in today's shape (S1-data-model 2.2).
            ...placed.legacy,
            languages: [],
            profileCompleted: false,
            isPublished: false,
            verificationStatus: 'NOT_STARTED',
            consentProfileShareAt: now,
            consentWordingVersion: input.consentWordingVersion,
            zohoLeadId: input.zohoLeadId ?? null,
            updatedAt: now,
          },
        },
      },
      select: { id: true, workerProfile: { select: { id: true } } },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') throw new EmailTaken()
    throw err
  }
  const workerProfileId = user.workerProfile!.id

  await tx.registrationPhotoUpload.update({ where: { id: input.photoUploadId }, data: { claimedByWorkerProfileId: workerProfileId } })
  await tx.workerService.createMany({ data: services.map((s) => ({ workerProfileId, ...s })) })
  await tx.workerLocation.create({ data: { id: randomUUID(), workerProfileId, ...placed.home, updatedAt: now } })

  // The marker. Obligations come from the document catalogue (not in apps/api
  // yet), so none are known at sign-up: SIGNED_UP with zero counts; the reconciler
  // fills them in from verification_requirements.
  const facts = { obligations: [], published: false, now }
  const stage = deriveStage(facts)
  await tx.workerOnboarding.create({
    data: { workerProfileId, stage, stageEnteredAt: now, signedUpAt: now, lastActivityAt: now, ...countsOf(facts), updatedAt: now },
  })
  await tx.workerOnboardingTransition.create({ data: { workerProfileId, fromStage: null, toStage: stage, at: now, cause: 'WorkerRegistered', source: 'API' } })

  await ctx.audit.record(tx, {
    action: 'ACCOUNT_REGISTERED',
    userId: user.id,
    metadata: { workerProfileId, breachedPasswordCheck: breach.status },
  })
  await enqueue(tx, { type: 'WorkerRegistered', payload: { userId: user.id, workerProfileId } }, now)
}
