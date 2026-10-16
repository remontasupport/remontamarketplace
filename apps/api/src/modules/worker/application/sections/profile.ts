// The column sections on worker_profiles (U2 R2.1-R2.3, R5; L2): name, bio, date of birth,
// gender, vehicle, ABN. Each runs inside replaceSection's transaction and returns the section as stored.
import { AGE_MAX, AGE_MIN, ageOn, type AbnBody, type AbnView, type BioBody, type DateOfBirthBody, type GenderBody, type NameBody, type VehicleBody } from '@remonta/api-contract'
import { abnChecksum } from '@remonta/schemas/validations/abn'
import { ApiError } from '../../../../platform/errors'
import type { Tx } from '../../../../platform/persistence/db'

export async function writeName(tx: Tx, profileId: string, body: NameBody): Promise<NameBody> {
  return tx.workerProfile.update({
    where: { id: profileId },
    data: { firstName: body.firstName, middleName: body.middleName, lastName: body.lastName },
    select: { firstName: true, middleName: true, lastName: true },
  })
}

export async function writeBio(tx: Tx, profileId: string, body: BioBody): Promise<BioBody> {
  const row = await tx.workerProfile.update({ where: { id: profileId }, data: { introduction: body.bio }, select: { introduction: true } })
  return { bio: row.introduction ?? '' }
}

/** R2.3: the age window re-checked with the api's clock; `age` is never written (readers compute from the date). */
export async function writeDateOfBirth(tx: Tx, profileId: string, body: DateOfBirthBody, now: Date): Promise<DateOfBirthBody> {
  const age = ageOn(body.dateOfBirth, now)
  if (age < AGE_MIN || age > AGE_MAX) throw new ApiError(400, 'date of birth outside the window', { dateOfBirth: [`Between ${AGE_MIN} and ${AGE_MAX} years old`] })
  const row = await tx.workerProfile.update({ where: { id: profileId }, data: { dateOfBirth: body.dateOfBirth }, select: { dateOfBirth: true } })
  return row as DateOfBirthBody
}

export async function writeGender(tx: Tx, profileId: string, body: GenderBody): Promise<GenderBody> {
  const row = await tx.workerProfile.update({ where: { id: profileId }, data: { gender: body.gender }, select: { gender: true } })
  return row as GenderBody
}

export async function writeVehicle(tx: Tx, profileId: string, body: VehicleBody): Promise<VehicleBody> {
  const row = await tx.workerProfile.update({ where: { id: profileId }, data: { hasVehicle: body.hasVehicle }, select: { hasVehicle: true } })
  return row as VehicleBody
}

/** R5: the ATO check re-run; `signed` kept when the stored engagement is an ABN, else false (a TFN is replaced, D17). */
/**
 * U4d: the engagement marked signed, with the contract that proves it (the caller records the PDF in the same
 * transaction). An ABN already stored stays when the engagement is still ABN; a TFN is never stored (D17).
 */
export async function writeSignedEngagement(tx: Tx, profileId: string, type: 'abn' | 'tfn'): Promise<{ type: 'abn' | 'tfn'; signed: true }> {
  const stored = await tx.workerProfile.findUnique({ where: { id: profileId }, select: { abn: true } })
  const prev = (stored?.abn as { workerEngagementType?: { type?: unknown; value?: unknown } } | null)?.workerEngagementType
  const keep = type === 'abn' && prev?.type === 'abn' && typeof prev.value === 'string' && /^\d{11}$/.test(prev.value) ? { value: prev.value } : {}
  await tx.workerProfile.update({ where: { id: profileId }, data: { abn: { workerEngagementType: { type, signed: true, ...keep } } }, select: { id: true } })
  return { type, signed: true }
}

export async function writeAbn(tx: Tx, profileId: string, body: AbnBody): Promise<AbnView> {
  if (!abnChecksum(body.abn)) throw new ApiError(400, 'abn checksum', { abn: ['That is not a valid ABN'] })
  const stored = await tx.workerProfile.findUnique({ where: { id: profileId }, select: { abn: true } })
  const prev = (stored?.abn as { workerEngagementType?: { type?: unknown; signed?: unknown } } | null)?.workerEngagementType
  const signed = prev?.type === 'abn' && prev.signed === true
  const view: AbnView = { type: 'abn', value: body.abn, signed }
  await tx.workerProfile.update({ where: { id: profileId }, data: { abn: { workerEngagementType: view } }, select: { id: true } })
  return view
}
