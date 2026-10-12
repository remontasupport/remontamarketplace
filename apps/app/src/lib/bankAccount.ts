// The admin page's bank account mask (U2 H6, C21): the same function as the api's
// (apps/api/src/modules/worker/domain/bank-account.ts), applied in the admin route so the
// stored BSB and account number never reach a browser. lib/bankAccount.test.ts proves the
// two agree. Anything malformed is null, never a partial leak.
export interface MaskedBankAccount {
  accountName: string
  bankName: string
  bsbLast3: string
  accountNumberLast3: string
}

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
