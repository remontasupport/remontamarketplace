// The additional-details groups and the bank account on worker_additional_info (U2 R6,
// R7.2-R7.3). A group write touches only that group's columns (property P7); the row is
// created on the first write. The bank account is stored as today's JSON and only ever
// leaves masked (R6.3).
import type { AdditionalInfoBody, AdditionalInfoGroup, BankAccountBody, MaskedBankAccount } from '@remonta/api-contract'
import type { Tx } from '../../../../platform/persistence/db'
import { maskBankAccount } from '../../domain/bank-account'

/** The columns each group owns (R7.2): a write sets these and nothing else, whatever the body holds (a second guard behind the strict body). */
export const GROUP_COLUMNS: Readonly<Record<AdditionalInfoGroup, readonly string[]>> = {
  'good-to-know': ['lgbtqiaSupport'],
  languages: ['languages'],
  'cultural-background': ['culturalBackground'],
  religion: ['religion'],
  interests: ['interests'],
  'support-activities': ['uniqueService'],
  'fun-fact': ['funFact'],
  preferences: ['workPreferences'],
  personality: ['personality', 'nonSmoker', 'petFriendly'],
}

/** The body's columns for its group (pure, tested). */
export function columnsOf(group: AdditionalInfoGroup, body: Record<string, unknown>): Record<string, unknown> {
  const allowed = GROUP_COLUMNS[group]
  return Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))
}

/** One group's write (its own entry since 2026-10-14): the row is created on the first write; the group's columns come back as stored. */
export async function writeAdditionalInfo<G extends AdditionalInfoGroup>(tx: Tx, profileId: string, group: G, body: AdditionalInfoBody<G>): Promise<AdditionalInfoBody<G>> {
  const data = columnsOf(group, body)
  const select = Object.fromEntries(GROUP_COLUMNS[group].map((c) => [c, true]))
  const row = await tx.workerAdditionalInfo.upsert({
    where: { workerProfileId: profileId },
    create: { workerProfileId: profileId, ...data },
    update: data,
    select,
  })
  return row as AdditionalInfoBody<G>
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
