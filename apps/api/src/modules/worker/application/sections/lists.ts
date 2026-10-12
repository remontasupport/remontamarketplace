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

const JOB_SELECT = { id: true, jobTitle: true, company: true, startMonth: true, startYear: true, endMonth: true, endYear: true, currentlyWorking: true } as const
const COURSE_SELECT = { id: true, institution: true, qualification: true, startMonth: true, startYear: true, endMonth: true, endYear: true, currentlyStudying: true } as const

type WithIds<B extends { entries: unknown[] }> = { entries: (B['entries'][number] & { id: string })[] }

export async function writeJobHistory(tx: Tx, profileId: string, body: JobHistoryBody): Promise<WithIds<JobHistoryBody>> {
  await tx.workerJobHistory.deleteMany({ where: { workerProfileId: profileId } })
  if (body.entries.length) await tx.workerJobHistory.createMany({ data: body.entries.map((e, i) => ({ workerProfileId: profileId, ...e, sortOrder: i })) })
  const rows = await tx.workerJobHistory.findMany({ where: { workerProfileId: profileId }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], select: JOB_SELECT })
  return { entries: rows as WithIds<JobHistoryBody>['entries'] }
}

export async function writeEducation(tx: Tx, profileId: string, body: EducationBody): Promise<WithIds<EducationBody>> {
  await tx.workerEducation.deleteMany({ where: { workerProfileId: profileId } })
  if (body.entries.length) await tx.workerEducation.createMany({ data: body.entries.map((e, i) => ({ workerProfileId: profileId, ...e, sortOrder: i })) })
  const rows = await tx.workerEducation.findMany({ where: { workerProfileId: profileId }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], select: COURSE_SELECT })
  return { entries: rows as WithIds<EducationBody>['entries'] }
}
