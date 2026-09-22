/**
 * W1 reads — the typed tables rendered back into the shapes consumers expect.
 *
 * Every read site that used to select a Json column goes through here, so the
 * shapes are defined once. Getting them subtly wrong in six places is how a
 * worker's profile ends up showing blank months on one page and correct ones on
 * another.
 *
 * The shapes are deliberately JSON-EQUIVALENT rather than tidier. Consumers
 * were written against the Json and are not being changed as part of W1:
 *
 *   - months are month NAMES ("January"), because WorkerProfileView maps them
 *     through monthMap and the editors offer them as dropdown values
 *   - years are strings, because the zod schemas declare them as strings
 *   - times are zero-padded "HH:MM", because the editor parses them as
 *     dayjs('2000-01-01T' + value)
 *   - experience is keyed by slug ("aged-care"), and the presence of a key is
 *     what the editor reads as "this area is selected"
 *
 * The one place this does not mirror the Json exactly: availability always
 * returns an ARRAY of slots per day. The Json collapsed a single slot to a bare
 * object (availability.service.ts:180), and WorkerProfileView:849 already
 * handles both, so the inconsistency is not worth reproducing.
 */

import { authPrisma } from '@/lib/auth-prisma'
import { DOMAIN_TO_SLUG, fromMinutes } from '@/lib/w1/promote'

/** Int? year in the table, string in every consumer. */
const year = (v: number | null): string => (v === null ? '' : String(v))

export type JobHistoryEntry = {
  jobTitle: string
  company: string
  startMonth: string
  startYear: string
  endMonth: string
  endYear: string
  currentlyWorking: boolean
}

export type EducationEntry = {
  qualification: string
  institution: string
  startMonth: string
  startYear: string
  endMonth: string
  endYear: string
  currentlyStudying: boolean
}

export type ExperienceEntry = {
  isProfessional: boolean
  isPersonal: boolean
  specificAreas: string[]
  description: string
  otherAreas: string[]
}

export type TimeSlot = { startTime: string; endTime: string }

/** Array order is the identity: consumers key entries by index. */
export async function readJobHistory(workerProfileId: string): Promise<JobHistoryEntry[]> {
  const rows = await authPrisma.workerJobHistory.findMany({
    where: { workerProfileId },
    orderBy: { sortOrder: 'asc' },
  })
  return rows.map((r) => ({
    jobTitle: r.jobTitle,
    company: r.company,
    startMonth: r.startMonth ?? '',
    startYear: year(r.startYear),
    endMonth: r.endMonth ?? '',
    endYear: year(r.endYear),
    currentlyWorking: r.currentlyWorking,
  }))
}

export async function readEducation(workerProfileId: string): Promise<EducationEntry[]> {
  const rows = await authPrisma.workerEducation.findMany({
    where: { workerProfileId },
    orderBy: { sortOrder: 'asc' },
  })
  return rows.map((r) => ({
    qualification: r.qualification,
    institution: r.institution,
    startMonth: r.startMonth ?? '',
    startYear: year(r.startYear),
    endMonth: r.endMonth ?? '',
    endYear: year(r.endYear),
    currentlyStudying: r.currentlyStudying,
  }))
}

/**
 * Keyed by the original slug. A domain with no slug mapping is logged and
 * skipped: silently dropping it would make an area vanish from the editor with
 * no trace.
 */
export async function readExperience(
  workerProfileId: string,
): Promise<Record<string, ExperienceEntry>> {
  const rows = await authPrisma.workerExperience.findMany({ where: { workerProfileId } })
  const out: Record<string, ExperienceEntry> = {}
  for (const r of rows) {
    const slug = DOMAIN_TO_SLUG[r.domain]
    if (!slug) {
      console.warn(`[w1:read] experience: no slug for domain "${r.domain}"`)
      continue
    }
    out[slug] = {
      isProfessional: r.isProfessional,
      isPersonal: r.isPersonal,
      specificAreas: r.specificAreas,
      description: r.description ?? '',
      otherAreas: r.otherAreas,
    }
  }
  return out
}

/**
 * Flat list of slots, for the availability editor. Postgres orders an enum by
 * its declaration order, so days come back MONDAY..SUNDAY.
 */
export async function readAvailabilitySlots(
  workerProfileId: string,
): Promise<{ dayOfWeek: string; startTime: string; endTime: string }[]> {
  const rows = await authPrisma.workerAvailability.findMany({
    where: { workerProfileId },
    orderBy: [{ dayOfWeek: 'asc' }, { sortOrder: 'asc' }, { startMinute: 'asc' }],
  })
  return rows.map((r) => ({
    dayOfWeek: r.dayOfWeek,
    startTime: fromMinutes(r.startMinute),
    endTime: fromMinutes(r.endMinute),
  }))
}

/** Day-keyed, for the display components. Always an array per day. */
export async function readAvailabilityByDay(
  workerProfileId: string,
): Promise<Record<string, TimeSlot[]>> {
  const slots = await readAvailabilitySlots(workerProfileId)
  const out: Record<string, TimeSlot[]> = {}
  for (const s of slots) {
    if (!out[s.dayOfWeek]) out[s.dayOfWeek] = []
    out[s.dayOfWeek].push({ startTime: s.startTime, endTime: s.endTime })
  }
  return out
}

/**
 * All four at once, for the read sites that select every Json column together.
 * One round trip per table rather than four sequential ones.
 */
export async function readAllPromoted(workerProfileId: string) {
  const [jobHistory, education, experience, availability] = await Promise.all([
    readJobHistory(workerProfileId),
    readEducation(workerProfileId),
    readExperience(workerProfileId),
    readAvailabilityByDay(workerProfileId),
  ])
  return { jobHistory, education, experience, availability }
}
