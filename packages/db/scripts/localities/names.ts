// Suburb names. G-NAF publishes them in capitals ("MCMAHONS POINT"); workers see
// them in the autocomplete, so they are title-cased for display. Search never uses
// the display form: it matches on searchName(), which is the same for every casing,
// so a casing rule that gets a name wrong can make it look odd but never unfindable.

/** Lower-case, trimmed, single-spaced. What the search box matches on. */
export function searchName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}

/**
 * Title case for G-NAF names:
 * - a letter starts a word after a space, hyphen, "(" or "." (Ti-Tree, Cocos (Keeling), O.B. Flat)
 * - after an apostrophe only when a single letter precedes it (O'Connor, D'Aguilar),
 *   so possessives stay lower-case (Yateman's Bore, Stun'sail Boom)
 * - "Mc" capitalises the next letter (McMahons Point). "Mac" does not: Macquarie,
 *   Macarthur and Macnamara are the common case.
 */
export function displayName(name: string): string {
  const lower = searchName(name)
  let out = ''
  for (let i = 0; i < lower.length; i++) {
    const ch = lower[i] as string
    const prev = i > 0 ? (lower[i - 1] as string) : ' '
    const startsWord =
      i === 0 ||
      prev === ' ' ||
      prev === '-' ||
      prev === '(' ||
      prev === '.' ||
      (prev === "'" && isSingleLetterBefore(lower, i - 1)) ||
      isAfterMc(lower, i)
    out += startsWord ? ch.toUpperCase() : ch
  }
  return out
}

function isSingleLetterBefore(s: string, apostrophe: number): boolean {
  const letter = s[apostrophe - 1]
  const before = apostrophe >= 2 ? s[apostrophe - 2] : ' '
  return letter !== undefined && /[a-z]/.test(letter) && (before === ' ' || before === '-')
}

function isAfterMc(s: string, i: number): boolean {
  if (i < 2 || s.slice(i - 2, i) !== 'mc') return false
  const before = i >= 3 ? s[i - 3] : ' '
  return (before === ' ' || before === '-') && /[a-z]/.test(s[i] as string)
}
