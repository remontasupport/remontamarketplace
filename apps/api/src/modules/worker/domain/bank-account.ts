// R2.3 (U1 worker-area): the stored bank account never leaves the api. The read maps
// the JSON `worker_additional_info.bankAccount` writes today ({ accountName, bankName,
// bsb, accountNumber }) through this mask; anything malformed is null, never a
// partial leak. Pure.
import type { MaskedBankAccount } from '@remonta/api-contract'

const last3 = (digits: string) => digits.replace(/\D/g, '').slice(-3)

export function maskBankAccount(stored: unknown): MaskedBankAccount | null {
  if (!stored || typeof stored !== 'object') return null
  const b = stored as Record<string, unknown>
  if (typeof b.accountName !== 'string' || typeof b.bankName !== 'string' || typeof b.bsb !== 'string' || typeof b.accountNumber !== 'string') return null
  const bsbLast3 = last3(b.bsb)
  const accountNumberLast3 = last3(b.accountNumber)
  if (bsbLast3.length !== 3 || accountNumberLast3.length !== 3) return null
  return { accountName: b.accountName.slice(0, 100), bankName: b.bankName.slice(0, 100), bsbLast3, accountNumberLast3 }
}
