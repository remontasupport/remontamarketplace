// The services section (api-review U3a, services-inventory.md): the chosen services and the registrations two of them
// carry. Replaces the app's step-101 save, deleteWorkerService and the four registration actions.
//
// Removing a service deletes it entirely (D2, user 2026-10-15): its worker_services row with the registration in its
// metadata, and its documents -- the SERVICE_QUALIFICATION rows keyed "<service name>:<type>" -- in the same
// transaction; their files after the commit, only from the worker's own folders (ownServiceDocument).
import {
  REGISTRATION_SERVICES,
  type RegistrationService,
  type ServiceRegistrationBody,
  type ServiceRegistrationView,
  type ServicesBody,
} from '@remonta/api-contract'
import { ApiError } from '../../../../platform/errors'
import { Prisma, type Tx } from '../../../../platform/persistence/db'
import { resolveServices } from '../../../registration/application/resolve-services'
import { isBlobUrl } from '../photos'

const SERVICE_SELECT = { categoryId: true, categoryName: true, subcategoryIds: true, subcategoryNames: true } as const

type Metadata = Prisma.JsonValue | null | undefined
const isObject = (m: Metadata): m is Prisma.JsonObject => typeof m === 'object' && m !== null && !Array.isArray(m)

export interface ServicesWrite {
  body: { services: { categoryId: string; categoryName: string; subcategoryIds: string[]; subcategoryNames: string[] }[] }
  /** The removed services' document files, to delete after the commit (deleteServiceFiles). */
  files: string[]
}

export async function writeServices(tx: Tx, profileId: string, body: ServicesBody, now: Date): Promise<ServicesWrite> {
  const chosen = await resolveServices(tx, body.services, body.subcategoryIds).catch((e: unknown) => {
    // The sign-up names the sub-category field supportWorkerCategories; this body calls it subcategoryIds.
    if (e instanceof ApiError && e.fields?.supportWorkerCategories) throw new ApiError(400, e.cause_, { subcategoryIds: e.fields.supportWorkerCategories })
    throw e
  })
  // In the read's order (createdAt, id): the answer is built from these rows, with no re-read (audit P6).
  const existing = await tx.workerService.findMany({ where: { workerProfileId: profileId }, select: { id: true, ...SERVICE_SELECT }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] })
  const keep = new Set(chosen.map((c) => c.categoryId))

  const removed = existing.filter((r) => !keep.has(r.categoryId))
  let files: string[] = []
  if (removed.length) {
    const docs = { workerProfileId: profileId, documentCategory: 'SERVICE_QUALIFICATION' as const, OR: removed.map((r) => ({ requirementType: { startsWith: `${r.categoryName}:` } })) }
    const rows = await tx.verificationRequirement.findMany({ where: docs, select: { documentUrl: true } })
    files = rows.flatMap((r) => (r.documentUrl ? [r.documentUrl] : []))
    await tx.verificationRequirement.deleteMany({ where: docs })
    await tx.workerService.deleteMany({ where: { id: { in: removed.map((r) => r.id) } } })
  }

  // A kept row is written only when the catalogue's names or the chosen sub-categories changed (usually never: audit P6).
  // New rows get distinct, increasing createdAt values after every kept one, so they follow in the order chosen.
  const same = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x, i) => x === b[i])
  const services: ServicesWrite['body']['services'] = []
  const added: ServicesWrite['body']['services'] = []
  for (const r of existing) {
    const c = chosen.find((x) => x.categoryId === r.categoryId)
    if (!c) continue
    if (c.categoryName !== r.categoryName || !same(c.subcategoryIds, r.subcategoryIds) || !same(c.subcategoryNames, r.subcategoryNames)) {
      await tx.workerService.update({ where: { id: r.id }, data: { categoryName: c.categoryName, subcategoryIds: c.subcategoryIds, subcategoryNames: c.subcategoryNames } })
    }
    services.push({ categoryId: c.categoryId, categoryName: c.categoryName, subcategoryIds: c.subcategoryIds, subcategoryNames: c.subcategoryNames })
  }
  for (const c of chosen) {
    if (existing.some((r) => r.categoryId === c.categoryId)) continue
    await tx.workerService.create({ data: { workerProfileId: profileId, ...c, createdAt: new Date(now.getTime() + added.length) }, select: { id: true } })
    added.push({ categoryId: c.categoryId, categoryName: c.categoryName, subcategoryIds: c.subcategoryIds, subcategoryNames: c.subcategoryNames })
  }
  return { body: { services: [...services, ...added] }, files }
}

/**
 * Is `url` a service document the app stored for this user: on Blob's host, under `workers/<userId>/service-documents/`
 * (the upload action) or `service-documents/<userId>/` (the old route), nothing after the path. Being on the worker's
 * row is not enough: a row's URL was never checked when it was written (F1's lesson).
 */
export function ownServiceDocument(url: string, userId: string): boolean {
  if (!isBlobUrl(url)) return false
  const u = new URL(url)
  if (u.search || u.hash || u.pathname.includes('..') || u.pathname.includes('%2')) return false
  return u.pathname.startsWith(`/workers/${userId}/service-documents/`) || u.pathname.startsWith(`/service-documents/${userId}/`)
}

/** After the commit, best-effort: each file in the worker's own folders is deleted; anything else is left and logged. */
export async function deleteServiceFiles(blob: { delete(urlOrKey: string): Promise<void> } | undefined, files: readonly string[], userId: string, log: { warn(o: object, m: string): void }): Promise<void> {
  for (const f of files) {
    if (!blob || !ownServiceDocument(f, userId)) {
      log.warn({ userId, reason: blob ? 'not-own-folder' : 'no-store' }, 'service document file left')
      continue
    }
    await blob.delete(f).catch((err: unknown) => log.warn({ userId, err: err instanceof Error ? err.message : String(err) }, 'service document file delete failed'))
  }
}

export async function writeServiceRegistration(tx: Tx, profileId: string, categoryId: RegistrationService, body: ServiceRegistrationBody): Promise<ServiceRegistrationView> {
  if (body.categoryId !== categoryId) throw new ApiError(400, 'registration body names another service', { categoryId: ['This registration is for another service'] })
  const row = await tx.workerService.findUnique({ where: { workerProfileId_categoryId: { workerProfileId: profileId, categoryId } }, select: { id: true } })
  // S4: a registration is saved only for a service the worker chose; today's action created the service row instead.
  if (!row) throw new ApiError(404, `service ${categoryId} not chosen`)
  const metadata =
    body.categoryId === 'nursing-services'
      ? body.nursingType === 'registered'
        ? { nursingType: body.nursingType, hasExperience: body.hasExperience, registrationNumber: body.registrationNumber, expiryDate: body.expiryDate }
        : { nursingType: body.nursingType, hasExperience: body.hasExperience }
      : { registrationNumber: body.registrationNumber, expiryDate: body.expiryDate }
  await tx.workerService.update({ where: { id: row.id }, data: { metadata } })
  return registrationOf(categoryId, metadata)!
}

const REAL_DATE = /^\d{4}-\d{2}-\d{2}$/
function realDate(v: unknown): string | null {
  if (typeof v !== 'string' || !REAL_DATE.test(v)) return null
  const d = new Date(`${v}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v ? v : null
}

/**
 * The registration a service row's metadata holds, read tolerantly: rows written before any rule carry numbers of
 * 0-2 characters and expiries such as "-01-00", which read as null. null when the row carries no registration.
 */
export function registrationOf(categoryId: string, metadata: Metadata): ServiceRegistrationView | null {
  if (!(REGISTRATION_SERVICES as readonly string[]).includes(categoryId) || !isObject(metadata)) return null
  const m = metadata
  const nursing = categoryId === 'nursing-services'
  const nursingType = nursing && (m.nursingType === 'registered' || m.nursingType === 'enrolled') ? m.nursingType : null
  const number = typeof m.registrationNumber === 'string' && m.registrationNumber.trim() ? m.registrationNumber.trim().slice(0, 60) : null
  const view: ServiceRegistrationView = {
    categoryId: categoryId as RegistrationService,
    nursingType,
    hasExperience: nursing && typeof m.hasExperience === 'boolean' ? m.hasExperience : null,
    registrationNumber: number,
    expiryDate: realDate(m.expiryDate),
  }
  return view.nursingType || view.registrationNumber || view.expiryDate ? view : null
}

/** The registrations of the chosen services, in REGISTRATION_SERVICES order. */
export function registrationsOf(services: readonly { categoryId: string; metadata?: Metadata }[]): ServiceRegistrationView[] {
  return REGISTRATION_SERVICES.flatMap((id) => {
    const r = registrationOf(id, services.find((s) => s.categoryId === id)?.metadata)
    return r ? [r] : []
  })
}
