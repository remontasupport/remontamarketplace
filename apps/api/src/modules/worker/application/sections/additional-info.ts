// The additional-details groups and the bank account on worker_additional_info (U2 R6,
// R7.2-R7.3). A group write touches only that group's columns (property P7); the row is
// created on the first write. The bank account is stored as today's JSON and only ever
// leaves masked (R6.3).
import type { AdditionalInfoBody, BankAccountBody, MaskedBankAccount } from '@remonta/api-contract'
import { ApiError } from '../../../../platform/errors'
import type { Tx } from '../../../../platform/persistence/db'
import { maskBankAccount } from '../../domain/bank-account'

type Group = AdditionalInfoBody['group']

/** The columns each group owns (R7.2); a write sets these and nothing else. */
export const GROUP_COLUMNS: Readonly<Record<Group, readonly string[]>> = {
  'good-to-know': ['lgbtqiaSupport'],
  languages: ['languages'],
  'cultural-background': ['culturalBackground'],
  religion: ['religion'],
  interests: ['interests'],
  'about-me': ['uniqueService', 'funFact'],
  preferences: ['workPreferences'],
  personality: ['personality', 'nonSmoker', 'petFriendly'],
}

/** The groups the completion percent reads (U1 R3.10: languages, personality); the others never change a flag. */
export const GROUPS_WITH_COMPLETION: ReadonlySet<Group> = new Set(['languages', 'personality'])

/** The body's columns for its group (pure, tested). */
export function columnsOf(body: AdditionalInfoBody): Record<string, unknown> {
  const { group, ...rest } = body
  const allowed = GROUP_COLUMNS[group]
  return Object.fromEntries(Object.entries(rest).filter(([k]) => allowed.includes(k)))
}

export async function writeAdditionalInfo(tx: Tx, profileId: string, pathGroup: Group, body: AdditionalInfoBody): Promise<AdditionalInfoBody> {
  if (body.group !== pathGroup) throw new ApiError(400, 'group mismatch', { group: ['Does not match the address'] })
  const data = columnsOf(body)
  const select = Object.fromEntries(GROUP_COLUMNS[body.group].map((c) => [c, true]))
  const row = await tx.workerAdditionalInfo.upsert({
    where: { workerProfileId: profileId },
    create: { workerProfileId: profileId, ...data },
    update: data,
    select,
  })
  return { group: body.group, ...row } as AdditionalInfoBody
}

/** R6.2: today's JSON shape. */
export function toStoredBankAccount(body: BankAccountBody): { accountName: string; bankName: string; bsb: string; accountNumber: string } {
  return { accountName: body.accountName, bankName: body.bankName, bsb: body.bsb, accountNumber: body.accountNumber }
}

export async function writeBankAccount(tx: Tx, profileId: string, body: BankAccountBody): Promise<MaskedBankAccount> {
  const stored = toStoredBankAccount(body)
  await tx.workerAdditionalInfo.upsert({ where: { workerProfileId: profileId }, create: { workerProfileId: profileId, bankAccount: stored }, update: { bankAccount: stored }, select: { id: true } })
  const masked = maskBankAccount(stored)
  if (!masked) throw new Error('bank account: the stored value does not mask (a schema/mask mismatch)')
  return masked
}
