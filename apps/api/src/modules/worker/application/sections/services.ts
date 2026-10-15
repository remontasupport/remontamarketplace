// The services section (api-review U3a, services-inventory.md): the chosen services and the registrations two of them
// carry. Replaces the app's step-101 save, deleteWorkerService and the four registration actions.
//
// Removing a service (D2, user 2026-10-15): worker_services rows are read by the search, the admin pages and the
// lists, so a removed service is deleted as today -- but its registration (the row's metadata) is first set aside in
// worker_service_archive, and put back when the service is chosen again. Its documents live on
// verification_requirements and are untouched: hidden while the service is not chosen, there again when it is.
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

const SERVICE_SELECT = { categoryId: true, categoryName: true, subcategoryIds: true, subcategoryNames: true } as const

type Metadata = Prisma.JsonValue | null | undefined
const isObject = (m: Metadata): m is Prisma.JsonObject => typeof m === 'object' && m !== null && !Array.isArray(m)

export async function writeServices(tx: Tx, profileId: string, body: ServicesBody, now: Date) {
  const chosen = await resolveServices(tx, body.services, body.subcategoryIds).catch((e: unknown) => {
    // The sign-up names the sub-category field supportWorkerCategories; this body calls it subcategoryIds.
    if (e instanceof ApiError && e.fields?.supportWorkerCategories) throw new ApiError(400, e.cause_, { subcategoryIds: e.fields.supportWorkerCategories })
    throw e
  })
  const existing = await tx.workerService.findMany({ where: { workerProfileId: profileId }, select: { id: true, categoryId: true, metadata: true } })
  const keep = new Set(chosen.map((c) => c.categoryId))

  const removed = existing.filter((r) => !keep.has(r.categoryId))
  for (const r of removed) {
    if (!isObject(r.metadata) || Object.keys(r.metadata).length === 0) continue
    await tx.workerServiceArchive.upsert({
      where: { workerProfileId_categoryId: { workerProfileId: profileId, categoryId: r.categoryId } },
      create: { workerProfileId: profileId, categoryId: r.categoryId, metadata: r.metadata },
      update: { metadata: r.metadata, archivedAt: now },
    })
  }
  if (removed.length) await tx.workerService.deleteMany({ where: { id: { in: removed.map((r) => r.id) } } })

  // New rows get distinct, increasing createdAt values so the read (createdAt order) shows them in the order chosen.
  let added = 0
  for (const c of chosen) {
    const row = existing.find((r) => r.categoryId === c.categoryId)
    if (row) {
      await tx.workerService.update({ where: { id: row.id }, data: { categoryName: c.categoryName, subcategoryIds: c.subcategoryIds, subcategoryNames: c.subcategoryNames } })
      continue
    }
    const key = { workerProfileId_categoryId: { workerProfileId: profileId, categoryId: c.categoryId } }
    const archived = await tx.workerServiceArchive.findUnique({ where: key, select: { metadata: true } })
    await tx.workerService.create({
      data: { workerProfileId: profileId, ...c, ...(archived ? { metadata: archived.metadata as Prisma.InputJsonValue } : {}), createdAt: new Date(now.getTime() + added++) },
    })
    if (archived) await tx.workerServiceArchive.delete({ where: key })
  }

  const services = await tx.workerService.findMany({ where: { workerProfileId: profileId }, select: SERVICE_SELECT, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] })
  return { services }
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
