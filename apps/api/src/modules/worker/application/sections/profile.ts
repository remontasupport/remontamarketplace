// The column sections on worker_profiles (U2 R2.1-R2.3, R5; L2): name, bio, personal info,
// ABN. Each runs inside replaceSection's transaction and returns the section as stored.
import { AGE_MAX, AGE_MIN, ageOn, type AbnBody, type AbnView, type BioBody, type NameBody, type PersonalInfoBody } from '@remonta/api-contract'
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
export async function writePersonalInfo(tx: Tx, profileId: string, body: PersonalInfoBody, now: Date): Promise<PersonalInfoBody> {
  const age = ageOn(body.dateOfBirth, now)
  if (age < AGE_MIN || age > AGE_MAX) throw new ApiError(400, 'date of birth outside the window', { dateOfBirth: [`Between ${AGE_MIN} and ${AGE_MAX} years old`] })
  const row = await tx.workerProfile.update({
    where: { id: profileId },
    data: { dateOfBirth: body.dateOfBirth, gender: body.gender, hasVehicle: body.hasVehicle },
    select: { dateOfBirth: true, gender: true, hasVehicle: true },
  })
  return row as PersonalInfoBody
}

/** R5: the ATO check re-run; `signed` kept when the stored engagement is an ABN, else false (a TFN is replaced, D17). */
export async function writeAbn(tx: Tx, profileId: string, body: AbnBody): Promise<AbnView> {
  if (!abnChecksum(body.abn)) throw new ApiError(400, 'abn checksum', { abn: ['That is not a valid ABN'] })
  const stored = await tx.workerProfile.findUnique({ where: { id: profileId }, select: { abn: true } })
  const prev = (stored?.abn as { workerEngagementType?: { type?: unknown; signed?: unknown } } | null)?.workerEngagementType
  const signed = prev?.type === 'abn' && prev.signed === true
  const view: AbnView = { type: 'abn', value: body.abn, signed }
  await tx.workerProfile.update({ where: { id: profileId }, data: { abn: { workerEngagementType: view } }, select: { id: true } })
  return view
}
