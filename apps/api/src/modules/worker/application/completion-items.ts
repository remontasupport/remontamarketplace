// "Complete", declared once (onboarding-tour C1; in application/, not domain/, because it reads the profile read's
// rows; functional design E1-E6, CR-1..CR-14). Every measure the worker sees --
// the My Profile ticks and percent, the three checklist groups and their next step, the service documents -- and the
// stored flags under the `groups` model are derived from the items below. Pure: the profile read's rows in, the view
// out. Today's rules (completion.ts) stay as they are: the Compliance group and each service's documents reuse them,
// and `storedFlags(..., 'legacy')` is exactly today's `completionOf` (the oracle the tests hold it to).
import { MY_PROFILE_PAGES, type Completion, type MyProfileSlug } from '@remonta/api-contract'
import type { FastifyBaseLogger } from 'fastify'
import type { Principal } from '../../../platform/auth/authenticator'
import { completionInputOf, type GetProfileDeps } from './get-profile'
import { profileNotFound } from './own-profile'
import { readProfileRows, type ProfileRows } from '../persistence/profile-read'
import { complianceOf, completionOf, flagsOf, nonEmpty, serviceDocumentsDone, serviceUploadsOf, trainingsOf, type CompletionFlags, type CompletionInput } from '../domain/completion'
import { requirementGroups } from '../domain/requirement-groups'
import { uploadableDocuments, type DocumentKind } from '../domain/service-requirements'

export type CompletionGroup = 'my-profile' | 'services' | 'compliance'
export const COMPLETION_GROUPS: readonly CompletionGroup[] = ['my-profile', 'services', 'compliance']
export type CompletionModel = 'legacy' | 'groups'
export const COMPLETION_MODELS: readonly CompletionModel[] = ['legacy', 'groups']

export interface CompletionItem {
  id: string
  group: CompletionGroup
  required: boolean
  done: boolean
}

export interface CompletionView {
  percent: number
  profileCompleted: boolean
  groups: { id: CompletionGroup; complete: boolean; done: number; total: number; firstUnfinished: string | null }[]
  items: CompletionItem[]
  serviceDocuments: { categoryId: string; documents: { type: string; name: string; kind: DocumentKind; required: boolean; uploaded: boolean }[] }[]
}

type Rows = ProfileRows['profile']

const filled = (list: readonly (string | null)[] | null | undefined) => (list ?? []).some((v) => nonEmpty(v))

/**
 * E2: the 18 My Profile pages, by the sidebar's slugs (`apps/app` workerMenu.ts) and in its order. 11 required
 * (CD3); the rest ticked when filled, never holding the percent back. No suburb is required (CD5).
 */
const PAGE_DONE: Record<MyProfileSlug, (p: Rows) => boolean> = {
  name: (p) => nonEmpty(p.firstName) && nonEmpty(p.lastName),
  photo: (p) => nonEmpty(p.photos),
  bio: (p) => (p.introduction ?? '').trim().length >= 50,
  address: (p) => p.homeLocality !== null,
  'date-of-birth': (p) => nonEmpty(p.dateOfBirth) || p.age !== null,
  gender: (p) => nonEmpty(p.gender),
  languages: (p) => filled(p.workerAdditionalInfo?.languages) || filled(p.languages),
  experience: (p) => p.careExperience.length > 0,
  'work-history': (p) => p.jobHistoryEntries.length > 0,
  education: (p) => p.educationEntries.length > 0,
  'preferred-hours': (p) => p.availability.length > 0,
  vehicle: (p) => ['yes', 'no'].includes((p.hasVehicle ?? '').trim().toLowerCase()),
  'cultural-background': (p) => filled(p.workerAdditionalInfo?.culturalBackground),
  religion: (p) => filled(p.workerAdditionalInfo?.religion),
  interests: (p) => filled(p.workerAdditionalInfo?.interests),
  'about-me': (p) => filled(p.workerAdditionalInfo?.uniqueService),
  preferences: (p) => filled(p.workerAdditionalInfo?.workPreferences),
  personality: (p) => nonEmpty(p.workerAdditionalInfo?.personality),
}
/** The contract's list (slugs, order, required) with this module's rule for each: a slug without a rule does not compile. */
export const MY_PROFILE_ITEMS: readonly { slug: MyProfileSlug; required: boolean; done: (p: Rows) => boolean }[] = MY_PROFILE_PAGES.map((x) => ({ ...x, done: PAGE_DONE[x.slug] }))
export const REQUIRED_MY_PROFILE_PAGES = MY_PROFILE_ITEMS.filter((x) => x.required).length

const COUNTING = new Set(['submitted', 'approved'])

/** E2-E4 in menu order. */
export function completionItems(rows: ProfileRows, input: CompletionInput = completionInputOf(rows)): CompletionItem[] {
  const p = rows.profile
  const myProfile = MY_PROFILE_ITEMS.map((x): CompletionItem => ({ id: x.slug, group: 'my-profile', required: x.required, done: x.done(p) }))
  const uploads = serviceUploadsOf(input.requirements)
  const services: CompletionItem[] = [
    { id: 'services-chosen', group: 'services', required: true, done: input.services.length > 0 },
    ...input.services.map((s): CompletionItem => ({ id: `service-documents:${s.categoryId}`, group: 'services', required: true, done: serviceDocumentsDone(s, uploads) })),
    { id: 'service-area', group: 'services', required: true, done: input.hasHome },
  ]
  const groups = requirementGroups({ profile: input.profile, services: input.services, requirements: input.requirements, catalogue: input.catalogue })
  const compliance: CompletionItem[] = [
    ...groups.mandatory.map((r): CompletionItem => ({ id: `compliance:${r.id}`, group: 'compliance', required: true, done: COUNTING.has(r.status) })),
    ...groups.trainings.map((r): CompletionItem => ({ id: `training:${r.id}`, group: 'compliance', required: true, done: COUNTING.has(r.status) })),
  ]
  return [...myProfile, ...services, ...compliance]
}

/** CR-2..CR-7, CR-14: the view from the items. The Compliance group's state is today's two flags (CR-5). */
export function completionView(rows: ProfileRows): CompletionView {
  const input = completionInputOf(rows)
  const items = completionItems(rows, input)
  const required = (g: CompletionGroup) => items.filter((i) => i.group === g && i.required)
  const complete: Record<CompletionGroup, boolean> = {
    'my-profile': required('my-profile').every((i) => i.done),
    services: required('services').every((i) => i.done),
    compliance: complianceOf(input) && trainingsOf(input),
  }
  const groups = COMPLETION_GROUPS.map((g) => {
    const req = required(g)
    // CR-7: the first required item not done; an incomplete group whose items all read done points at its first item.
    // Compliance has no items until a service is chosen (requirementGroups R4.1): its next step is choosing one.
    const next = complete[g] ? null : (req.find((i) => !i.done)?.id ?? req[0]?.id ?? 'services-chosen')
    return { id: g, complete: complete[g], done: req.filter((i) => i.done).length, total: req.length, firstUnfinished: next }
  })
  const uploads = serviceUploadsOf(input.requirements)
  const serviceDocuments = input.services.map((s) => {
    const mine = uploads.get(s.categoryName.toLowerCase()) ?? new Set<string>()
    return {
      categoryId: s.categoryId,
      documents: [...uploadableDocuments(s.categoryName, s.subcategoryIds)].map(([type, d]) => ({ type, name: d.name, kind: d.kind, required: d.required, uploaded: mine.has(type) })),
    }
  })
  const doneRequired = required('my-profile').filter((i) => i.done).length
  return {
    percent: Math.round((100 * doneRequired) / REQUIRED_MY_PROFILE_PAGES),
    profileCompleted: complete['my-profile'] && complete.services && complete.compliance,
    groups,
    items,
    serviceDocuments,
  }
}

/**
 * E6: what `persistCompletion` stores under the stage's model. `legacy` is today's `completionOf` exactly; `groups`
 * maps the four stored keys onto the three groups (accountDetails = My Profile, services = Services; compliance and
 * trainings as today) and `profileCompleted` onto the three.
 */
export function storedCompletion(rows: ProfileRows, model: CompletionModel): Completion {
  const input = completionInputOf(rows)
  const today = completionOf(input)
  if (model === 'legacy') return today
  const v = completionView(rows)
  const group = (g: CompletionGroup) => v.groups.find((x) => x.id === g)!.complete
  return { accountDetails: group('my-profile'), compliance: today.compliance, trainings: today.trainings, services: group('services'), profileCompleted: v.profileCompleted, percent: v.percent }
}

export const storedFlags = (c: Completion): CompletionFlags => flagsOf(c)

/** L2: `GET /v1/worker/completion` -- the profile read's rows (its transaction and timeout), 404 without a profile row. */
export async function getCompletion(deps: GetProfileDeps, principal: Principal, log: FastifyBaseLogger): Promise<CompletionView> {
  const rows = await (deps.read ?? readProfileRows)(deps.db, principal.userId)
  if (!rows) throw profileNotFound(principal, log)
  return completionView(rows)
}
