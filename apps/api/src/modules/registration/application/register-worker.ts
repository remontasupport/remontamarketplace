// Worker registration (S1-design 3.4, S1-data-model 4).
//
//   R1 no enumeration: a new and an existing email get the same 202 and body, and
//      the password is hashed in both branches so the timing is similar.
//   R2 truthful: the account is usable at once; the message says so.
//   R3 atomic: user, profile, services, HOME location, onboarding marker and its
//      first transition, the photo claim, the audit row and the outbox event commit
//      together or not at all.
//   R4 the photo is claimed once: a used or expired upload is refused (claimPhoto).
//   R5 a browser retry after a commit lands in R1 (noticeExistingAccount).
//   R6 the email was verified (S1 step 13): the sign-up carries the code's ticket
//      and the server re-checks it against the body's email, before the lookup,
//      so a refusal says nothing about whether an account exists.
//   R7 the signed agreement (signup-abn-agreement U1, optional until U3): the PDF is
//      checked and copied into the worker's folder before the transaction, recorded in
//      it with the signed ABN engagement; whatever records nothing deletes the file.
import { randomUUID } from 'node:crypto'
import { REGISTRATION_ACCEPTED_MESSAGE } from '@remonta/api-contract'
import type { WorkerRegistration } from '@remonta/schemas/schema/workerRegistrationSchema'
import type { StagedDocument } from '../../worker/application/service-documents'
import type { FastifyBaseLogger } from 'fastify'
import type { AuditRecorder } from '../../../platform/audit'
import { systemClock, type Clock } from '../../../platform/clock'
import { ApiError } from '../../../platform/errors'
import { enqueue } from '../../../platform/outbox/outbox'
import { Prisma, unitOfWork, type Db, type Tx } from '../../../platform/persistence/db'
import type { PasswordHasher } from '../../../platform/security/password-hasher'
import { placeHome } from '../../locations/domain/home'
import { openOnboarding } from '../../onboarding/markers'
import type { PhotoStore } from '../adapters/photo-store'
import type { BreachCheck, BreachedPasswordChecker } from '../adapters/pwned-passwords'
import { checkEmailCode } from '../domain/email-code'
import { PHOTO_UPLOADED, WORKER_REGISTERED, type PhotoUploadedPayload, type WorkerRegisteredPayload } from '../domain/events'
import { findUserIdByEmail } from '../persistence/users'
import { AGREEMENT_STORE_UNAVAILABLE, discardAgreement, recordAgreement, stageAgreement } from './agreement'
import { noticeExistingAccount } from './existing-account'
import { attachPhoto, claimPhoto } from './photo-claim'
import { resolveServices, type ResolvedService } from './resolve-services'

export interface RegisterDeps {
  db: Db
  hasher: PasswordHasher
  breaches: BreachedPasswordChecker
  /** Signs and checks the email-code tickets (S1 step 13). */
  codeSecret: string
  /** The private bucket: the signed agreement's upload (R7). */
  bucket?: PhotoStore
  now?: Clock
}

export const EMAIL_NOT_VERIFIED = 'Please verify your email address again'

export interface RegisterContext {
  audit: AuditRecorder
  log: FastifyBaseLogger
  /** zohoLeadId as sent, before the schema dropped a malformed one. */
  rawZohoLeadId: unknown
}

export const ACCEPTED = { status: 202, body: { status: 'accepted', message: REGISTRATION_ACCEPTED_MESSAGE } } as const

/** Raised inside the transaction when a concurrent registration took the email. */
class EmailTaken extends Error {}

/** R7: the copied PDF and the profile id it was copied for. */
interface SignedAgreement {
  profileId: string
  staged: StagedDocument
}

export async function registerWorker(input: WorkerRegistration, deps: RegisterDeps, ctx: RegisterContext) {
  const now = (deps.now ?? systemClock)()

  if (typeof ctx.rawZohoLeadId === 'string' && ctx.rawZohoLeadId.trim() !== '' && input.zohoLeadId === undefined) {
    ctx.log.warn('zohoLeadId was malformed and has been dropped; registration continues') // US-REG-04
  }

  // R6, then the breach check: both for every email, before the email is looked up,
  // so a refusal here says nothing about whether an account exists.
  const verified = checkEmailCode(deps.codeSecret, { ...input.emailVerification, email: input.email }, now)
  if (verified !== 'ok') throw new ApiError(400, `email verification ${verified}`, { emailVerification: [EMAIL_NOT_VERIFIED] })

  const breach = await deps.breaches.check(input.password)
  if (breach.status === 'breached') {
    throw new ApiError(400, 'breached password', { password: ['This password has appeared in a data breach. Please choose a different one.'] })
  }
  if (breach.status === 'unknown') ctx.log.warn({ reason: breach.reason }, 'breached-password check unavailable; accepted (Q2 = A)')

  const services = await resolveServices(deps.db, input.services, input.supportWorkerCategories ?? [])

  // R1: hash in both branches.
  const passwordHash = await deps.hasher.hash(input.password)

  const existing = await findUserIdByEmail(deps.db, input.email)
  if (existing) {
    await discardAgreement(deps.bucket, input.agreement, null, ctx.log)
    return existingAccount(existing, deps.db, ctx, now)
  }

  // R7: the profile's id is chosen here so the PDF lands in its folder before any row exists.
  let agreement: SignedAgreement | null = null
  if (input.agreement) {
    if (!deps.bucket) throw new ApiError(503, 'agreement store not configured', { agreement: [AGREEMENT_STORE_UNAVAILABLE] }, { 'retry-after': '2' })
    const profileId = randomUUID()
    agreement = { profileId, staged: await stageAgreement(deps.bucket, input.agreement, profileId, ctx.log) }
  }

  try {
    await unitOfWork(deps.db, (tx) => createAccount(tx, input, passwordHash, services, breach, now, ctx, agreement))
  } catch (err) {
    await discardAgreement(deps.bucket, input.agreement, agreement?.staged ?? null, ctx.log)
    if (err instanceof EmailTaken) {
      const taken = await findUserIdByEmail(deps.db, input.email)
      if (!taken) throw err
      return existingAccount(taken, deps.db, ctx, now)
    }
    throw err
  }
  return ACCEPTED
}

async function existingAccount(userId: string, db: Db, ctx: RegisterContext, now: Date) {
  ctx.audit.skip('email already registered: no account change')
  await noticeExistingAccount(db, userId, now)
  return ACCEPTED
}

async function createAccount(tx: Tx, input: WorkerRegistration, passwordHash: string, services: ResolvedService[], breach: BreachCheck, now: Date, ctx: RegisterContext, agreement: SignedAgreement | null) {
  const locality = await tx.auLocality.findFirst({ where: { id: input.localityId, retiredAt: null } })
  if (!locality) throw new ApiError(400, `locality ${input.localityId} unknown or retired`, { localityId: ['Please choose your suburb from the list'] })
  const placed = placeHome(locality, 'REGISTRATION')
  if (!placed.ok) throw new ApiError(400, 'locality retired', { localityId: ['Please choose your suburb from the list'] })

  // R4: claim the staged photo before anything else is written.
  const photo = await claimPhoto(tx, input.photoUploadId, now)
  if (!photo) throw new ApiError(400, 'photo upload missing, used or expired', { photoUploadId: ['Please upload your photo again'] })
  // U3 R3.4: the object is private until the processing handler writes the clean copy
  // to Blob and points the profile at it (a gap of seconds; the event is queued below).

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
            ...(agreement ? { id: agreement.profileId } : {}),
            firstName: input.firstName,
            lastName: input.lastName,
            mobile: input.mobile,
            photos: null,
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

  await attachPhoto(tx, input.photoUploadId, workerProfileId)
  await tx.workerService.createMany({ data: services.map((s) => ({ workerProfileId, ...s })) })
  await tx.workerLocation.create({ data: { id: randomUUID(), workerProfileId, ...placed.home, updatedAt: now } })
  await openOnboarding(tx, workerProfileId, now, WORKER_REGISTERED)
  if (agreement && input.agreement) await recordAgreement(tx, workerProfileId, input.agreement, agreement.staged, now)

  await ctx.audit.record(tx, {
    action: 'ACCOUNT_REGISTERED',
    userId: user.id,
    metadata: { workerProfileId, breachedPasswordCheck: breach.status, agreement: agreement !== null },
  })
  const payload: WorkerRegisteredPayload = { userId: user.id, workerProfileId }
  await enqueue(tx, { type: WORKER_REGISTERED, payload }, now)
  const photoPayload: PhotoUploadedPayload = { photoUploadId: input.photoUploadId, workerProfileId }
  await enqueue(tx, { type: PHOTO_UPLOADED, payload: photoPayload }, now)
}
