// The profile read (U1 worker-area, L2): rows -> completion -> requirement groups ->
// the contract's Profile (E1). Every field has one source column (R2.2); the bank
// account is masked here and nowhere later (R2.3, P8); no write (R2.8). The pipeline
// adds the private-cache headers and the ETag (R2.7).
import { ageOn, isoDateSchema, type Profile } from '@remonta/api-contract'
import type { FastifyBaseLogger } from 'fastify'
import type { Principal } from '../../../platform/auth/authenticator'
import type { Db } from '../../../platform/persistence/db'
import { localityLabel } from '../../locations/domain/home'
import { maskBankAccount } from '../domain/bank-account'
import { abnOf, completionOf, type CatalogueRows, type CompletionInput, type RequirementRow } from '../domain/completion'
import { displayRoleOf } from '../domain/display-role'
import { requirementGroups } from '../domain/requirement-groups'
import { readProfileRows, type ProfileRows } from '../persistence/profile-read'
import { profileNotFound } from './own-profile'
import { registrationsOf } from './sections/services'
import { complianceView } from './compliance-documents'
import { documentView } from './service-documents'

export interface GetProfileDeps {
  db: Db
  /** Injectable for the unit tests; the real one runs the transaction. */
  read?: (db: Db, userId: string) => Promise<ProfileRows | null>
  /** The api's clock, for the age (default: now). */
  now?: () => Date
}

export async function getProfile(deps: GetProfileDeps, principal: Principal, log: FastifyBaseLogger): Promise<Profile> {
  const rows = await (deps.read ?? readProfileRows)(deps.db, principal.userId)
  if (!rows) throw profileNotFound(principal, log)
  return shapeProfile(rows, (deps.now ?? (() => new Date()))())
}

/** The age from the date of birth as of `now`; the stored column only when there is no readable date (fix 2026-10-14). */
export function ageOf(p: { dateOfBirth: string | null; age: number | null }, now: Date): number | null {
  return p.dateOfBirth && isoDateSchema.safeParse(p.dateOfBirth).success ? ageOn(p.dateOfBirth, now) : p.age
}

/** E5 from the read's rows. Exported for the backfill (P14), which runs the same computation. */
export function completionInputOf(rows: ProfileRows): CompletionInput {
  const p = rows.profile
  const catalogue: CatalogueRows = { categories: rows.catalogue }
  const requirements: RequirementRow[] = p.verificationRequirements.map((r) => ({ requirementType: r.requirementType, status: r.status, documentCategory: r.documentCategory, documentUrl: r.documentUrl }))
  return {
    profile: { firstName: p.firstName, lastName: p.lastName, photos: p.photos, introduction: p.introduction, city: p.city, state: p.state, postalCode: p.postalCode, age: p.age, dateOfBirth: p.dateOfBirth, gender: p.gender, hasVehicle: p.hasVehicle, languages: p.languages, abn: p.abn },
    services: p.workerServices.map((s) => ({ categoryId: s.categoryId, categoryName: s.categoryName, subcategoryIds: s.subcategoryIds, subcategoryNames: s.subcategoryNames })),
    requirements,
    catalogue,
    hasHome: p.locations.length > 0,
    availabilityCount: p.availability.length,
    experienceCount: p.careExperience.length,
    jobHistoryCount: p.jobHistoryEntries.length,
    educationCount: p.educationEntries.length,
    additionalInfo: p.workerAdditionalInfo ? { languages: p.workerAdditionalInfo.languages, personality: p.workerAdditionalInfo.personality } : null,
  }
}

/** L2 step 4. */
export function shapeProfile(rows: ProfileRows, now: Date = new Date()): Profile {
  const p = rows.profile
  const input = completionInputOf(rows)
  const completion = completionOf(input)
  const requirements = requirementGroups({ profile: input.profile, services: input.services, requirements: input.requirements, catalogue: input.catalogue })
  const home = p.locations[0]
  const info = p.workerAdditionalInfo
  const abn = abnOf(p.abn)
  const hasVehicle = p.hasVehicle?.trim().toLowerCase()
  return {
    id: p.id,
    names: { firstName: p.firstName, middleName: p.middleName, lastName: p.lastName },
    mobile: p.mobile,
    photos: { main: p.photos || null },
    bio: p.introduction,
    personalInfo: {
      dateOfBirth: p.dateOfBirth,
      age: ageOf(p, now),
      gender: p.gender,
      hasVehicle: hasVehicle === 'yes' ? 'Yes' : hasVehicle === 'no' ? 'No' : null,
      languages: p.languages,
    },
    // D17: the number only for an ABN engagement; a TFN is never reported.
    abn: abn ? { type: abn.type, value: abn.type === 'abn' ? abn.value : null, signed: abn.signed } : null,
    // U2 (R3): the private home address; null until the worker saves one.
    homeAddress: p.homeStreetLine && p.homeLocality ? { streetLine: p.homeStreetLine, localityId: p.homeLocality.id, suburb: p.homeLocality.suburb, state: p.homeLocality.state, postcode: p.homeLocality.postcode } : null,
    serviceArea: home ? { localityId: home.localityId, label: localityLabel(home.locality, ', '), travelRadiusKm: home.travelRadiusKm ?? 0, precision: home.precision } : null,
    displayRole: displayRoleOf(p.workerServices),
    verificationStatus: p.verificationStatus.slice(0, 40),
    isPublished: p.isPublished,
    completion,
    requirements,
    services: p.workerServices.map((s) => ({ categoryId: s.categoryId, categoryName: s.categoryName, subcategoryIds: s.subcategoryIds, subcategoryNames: s.subcategoryNames })),
    serviceRegistrations: registrationsOf(p.workerServices),
    // U3b: the service documents, newest first (a legacy row keeps its public URL; a new one the app path).
    serviceDocuments: p.verificationRequirements
      .filter((r) => r.documentCategory === 'SERVICE_QUALIFICATION')
      .sort((a, b) => (b.documentUploadedAt?.getTime() ?? 0) - (a.documentUploadedAt?.getTime() ?? 0))
      .slice(0, 200)
      .map(documentView),
    // U4a: every other requirement row (identity, checks, trainings, contract, Code of Conduct), newest first.
    complianceDocuments: p.verificationRequirements
      .filter((r) => r.documentCategory !== 'SERVICE_QUALIFICATION')
      .sort((a, b) => (b.documentUploadedAt?.getTime() ?? 0) - (a.documentUploadedAt?.getTime() ?? 0))
      .slice(0, 200)
      .map(complianceView),
    sections: {
      availability: p.availability.map((a) => ({ day: a.dayOfWeek, startMinute: a.startMinute, endMinute: a.endMinute })),
      experience: p.careExperience.map((e) => ({ domain: e.domain, isProfessional: e.isProfessional, isPersonal: e.isPersonal, specificAreas: e.specificAreas, otherAreas: e.otherAreas, description: e.description })),
      jobHistory: p.jobHistoryEntries,
      education: p.educationEntries,
      additionalInfo: info
        ? {
            languages: info.languages,
            culturalBackground: info.culturalBackground,
            religion: info.religion,
            interests: info.interests,
            workPreferences: info.workPreferences,
            lgbtqiaSupport: info.lgbtqiaSupport,
            nonSmoker: info.nonSmoker,
            petFriendly: info.petFriendly,
            personality: info.personality,
            uniqueService: info.uniqueService,
            funFact: info.funFact,
          }
        : null,
      bankAccount: maskBankAccount(info?.bankAccount ?? null),
    },
    updatedAt: p.updatedAt.toISOString(),
  }
}
