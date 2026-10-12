// The Australian Business Number (worker-profile-api U2, R5.1, D17): eleven digits whose
// ATO check passes. One copy, used by the contract's schema (so a form refuses before
// sending), by apps/api (which re-checks the normalised value) and by the form engine's
// `abn` kind. Pure.

const WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19] as const

/** Spaces removed; nothing else is changed (a letter stays, and fails the digit test). */
export function normaliseAbn(input: string): string {
  return input.replace(/\s+/g, '')
}

/**
 * The ATO's check: subtract 1 from the first digit, weight the eleven digits with
 * 10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, and the sum must divide by 89.
 */
export function abnChecksum(digits: string): boolean {
  if (!/^\d{11}$/.test(digits)) return false
  let sum = 0
  for (let i = 0; i < 11; i++) {
    const d = Number(digits[i]) - (i === 0 ? 1 : 0)
    sum += d * WEIGHTS[i]!
  }
  return sum % 89 === 0
}

/** `normaliseAbn` then `abnChecksum`. */
export function isValidAbn(input: string): boolean {
  return abnChecksum(normaliseAbn(input))
}

/** "51 824 753 556" -- the ATO's own example, used by tests and placeholders. */
export const EXAMPLE_ABN = '51824753556'
