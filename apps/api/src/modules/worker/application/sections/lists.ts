// The list sections (U2 R2.7-R2.10, L3): preferred hours, experience, work history,
// education. Each is a whole replace -- delete the rows, insert the body's in order -- and
// returns the rows as stored. The contract's refinements already ran; the rules that
// decide data integrity (overlap, areas in the domain's list) are re-run here so a body
// that slipped past a client is still refused.
import {
  CARE_DOMAINS,
  slotIssues,
  sortSlots,
  type AvailabilityBody,
  type EducationBody,
  type ExperienceBody,
  type JobHistoryBody,
} from '@remonta/api-contract'
import { experienceAreasOf } from '@remonta/schemas/data/experienceAreas'
import { ApiError } from '../../../../platform/errors'
import type { Tx } from '../../../../platform/persistence/db'

export async function writeAvailability(tx: Tx, profileId: string, body: AvailabilityBody): Promise<AvailabilityBody> {
  const issues = slotIssues(body.slots)
  if (issues.length) throw new ApiError(400, 'availability rules', Object.fromEntries(issues.map((i) => [`slots.${i.index}.startMinute`, [i.message]])))
  const slots = sortSlots(body.slots)
  await tx.workerAvailability.deleteMany({ where: { workerProfileId: profileId } })
  if (slots.length) await tx.workerAvailability.createMany({ data: slots.map((s, i) => ({ workerProfileId: profileId, dayOfWeek: s.day, startMinute: s.startMinute, endMinute: s.endMinute, sortOrder: i })) })
  const rows = await tx.workerAvailability.findMany({ where: { workerProfileId: profileId }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], select: { dayOfWeek: true, startMinute: true, endMinute: true } })
  return { slots: rows.map((r) => ({ day: r.dayOfWeek, startMinute: r.startMinute, endMinute: r.endMinute })) }
}

export async function writeExperience(tx: Tx, profileId: string, body: ExperienceBody): Promise<ExperienceBody> {
  const fields: Record<string, string[]> = {}
  body.domains.forEach((d, i) => {
    const allowed = experienceAreasOf(d.domain)
    d.specificAreas.forEach((a, j) => {
      if (!allowed.includes(a)) fields[`domains.${i}.specificAreas.${j}`] = ["Not one of this area's options"]
    })
  })
  if (Object.keys(fields).length) throw new ApiError(400, 'experience areas', fields)
  await tx.workerExperience.deleteMany({ where: { workerProfileId: profileId } })
  if (body.domains.length) await tx.workerExperience.createMany({ data: body.domains.map((d) => ({ workerProfileId: profileId, ...d })) })
  const rows = await tx.workerExperience.findMany({ where: { workerProfileId: profileId }, select: { domain: true, isProfessional: true, isPersonal: true, specificAreas: true, otherAreas: true, description: true } })
  const order = (d: string) => (CARE_DOMAINS as readonly string[]).indexOf(d)
  return { domains: rows.sort((a, b) => order(a.domain) - order(b.domain)) }
}

/**
 * One care area out (2026-10-14: the page's delete, after its confirm). The row is the caller's profile's row for the
 * domain (unique per worker and domain), so another worker's row cannot be named. Idempotent: an area already gone
 * deletes nothing and the answer is the same list, so a retried request is not an error.
 */
export async function deleteExperienceArea(tx: Tx, profileId: string, domain: ExperienceBody['domains'][number]['domain']): Promise<ExperienceBody> {
  await tx.workerExperience.deleteMany({ where: { workerProfileId: profileId, domain } })
  const rows = await tx.workerExperience.findMany({ where: { workerProfileId: profileId }, select: { domain: true, isProfessional: true, isPersonal: true, specificAreas: true, otherAreas: true, description: true } })
  const order = (d: string) => (CARE_DOMAINS as readonly string[]).indexOf(d)
  return { domains: rows.sort((a, b) => order(a.domain) - order(b.domain)) }
}

const JOB_SELECT = { id: true, jobTitle: true, company: true, startMonth: true, startYear: true, endMonth: true, endYear: true, currentlyWorking: true } as const
const COURSE_SELECT = { id: true, institution: true, qualification: true, startMonth: true, startYear: true, endMonth: true, endYear: true, currentlyStudying: true } as const

type WithIds<B extends { entries: unknown[] }> = { entries: (B['entries'][number] & { id: string })[] }

export async function writeJobHistory(tx: Tx, profileId: string, body: JobHistoryBody): Promise<WithIds<JobHistoryBody>> {
  await tx.workerJobHistory.deleteMany({ where: { workerProfileId: profileId } })
  if (body.entries.length) await tx.workerJobHistory.createMany({ data: body.entries.map((e, i) => ({ workerProfileId: profileId, ...e, sortOrder: i })) })
  const rows = await tx.workerJobHistory.findMany({ where: { workerProfileId: profileId }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], select: JOB_SELECT })
  return { entries: rows as WithIds<JobHistoryBody>['entries'] }
}

/**
 * One work-history row out (2026-10-14: the page's delete, after its confirm). Scoped to the caller's profile: a row
 * that is not theirs, or no longer exists, deletes nothing and is 404 -- the same answer for both, so another worker's
 * row is never revealed (R1.3). The rows left keep their order.
 */
export async function deleteJobHistoryEntry(tx: Tx, profileId: string, id: string): Promise<WithIds<JobHistoryBody>> {
  const { count } = await tx.workerJobHistory.deleteMany({ where: { id, workerProfileId: profileId } })
  if (count === 0) throw new ApiError(404, 'job history row not found for this profile')
  const rows = await tx.workerJobHistory.findMany({ where: { workerProfileId: profileId }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], select: JOB_SELECT })
  return { entries: rows as WithIds<JobHistoryBody>['entries'] }
}

export async function writeEducation(tx: Tx, profileId: string, body: EducationBody): Promise<WithIds<EducationBody>> {
  await tx.workerEducation.deleteMany({ where: { workerProfileId: profileId } })
  if (body.entries.length) await tx.workerEducation.createMany({ data: body.entries.map((e, i) => ({ workerProfileId: profileId, ...e, sortOrder: i })) })
  const rows = await tx.workerEducation.findMany({ where: { workerProfileId: profileId }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], select: COURSE_SELECT })
  return { entries: rows as WithIds<EducationBody>['entries'] }
}

/** One education row out (2026-10-14), as deleteJobHistoryEntry: the caller's row or 404 (R1.3); the rows left keep their order. */
export async function deleteEducationEntry(tx: Tx, profileId: string, id: string): Promise<WithIds<EducationBody>> {
  const { count } = await tx.workerEducation.deleteMany({ where: { id, workerProfileId: profileId } })
  if (count === 0) throw new ApiError(404, 'education row not found for this profile')
  const rows = await tx.workerEducation.findMany({ where: { workerProfileId: profileId }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], select: COURSE_SELECT })
  return { entries: rows as WithIds<EducationBody>['entries'] }
}
