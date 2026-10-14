// Plain-English validation messages (2026-10-14: the pages showed Zod's own wording, e.g. "Too small: expected
// string to have >=1 characters" for an empty job title, "Invalid input: expected number, received string" for a
// year left unchosen). One function, passed to every safeParse that turns issues into messages a person reads:
// the form engine (what the page shows) and the api pipeline (the `fields` of a 400). A message written on a schema
// ("A BSB has 6 digits") always wins: Zod uses this function only where the schema has none.
import type * as z from 'zod'

/** A value nobody filled in: an empty string, nothing chosen, nothing sent. */
const isEmpty = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '')

const REQUIRED = 'This field is required.'

/** Zod's per-parse error map: `schema.safeParse(input, { error: friendlyError })`. Undefined keeps Zod's default. */
export const friendlyError: z.core.$ZodErrorMap = (iss) => {
  switch (iss.code) {
    case 'invalid_type':
      if (isEmpty(iss.input)) return REQUIRED
      if (iss.expected === 'number' || iss.expected === 'int') return 'Please enter a number.'
      if (iss.expected === 'boolean') return 'Please choose yes or no.'
      // A list, or a picked item (a suburb from the search): chosen, not typed.
      if (iss.expected === 'array' || iss.expected === 'object') return 'Please choose from the list.'
      if (iss.expected === 'string') return 'Please enter text.'
      return 'This value is not valid.'
    case 'too_small': {
      const min = Number(iss.minimum)
      if (iss.origin === 'string') return min <= 1 ? REQUIRED : `Please enter at least ${min} characters.`
      if (iss.origin === 'array' || iss.origin === 'set') return min <= 1 ? 'Please choose at least one.' : `Please choose at least ${min}.`
      if (iss.origin === 'number' || iss.origin === 'int' || iss.origin === 'bigint') return `Please enter ${min} or more.`
      if (iss.origin === 'date') return 'This date is too early.'
      return undefined
    }
    case 'too_big': {
      const max = Number(iss.maximum)
      if (iss.origin === 'string') return `Please keep this to ${max} characters or fewer.`
      if (iss.origin === 'array' || iss.origin === 'set') return `Please choose no more than ${max}.`
      if (iss.origin === 'number' || iss.origin === 'int' || iss.origin === 'bigint') return `Please enter ${max} or less.`
      if (iss.origin === 'date') return 'This date is too late.'
      return undefined
    }
    case 'invalid_value':
      return isEmpty(iss.input) ? REQUIRED : 'Please choose one of the options.'
    case 'invalid_format':
      if (isEmpty(iss.input)) return REQUIRED
      if (iss.format === 'email') return 'Please enter a valid email address.'
      if (iss.format === 'url') return 'Please enter a valid web address.'
      if (iss.format === 'date' || iss.format === 'datetime') return 'Please enter a valid date.'
      return 'Please check the format.'
    case 'not_multiple_of':
      return iss.divisor === 1 ? 'Please enter a whole number.' : `Please enter a multiple of ${String(iss.divisor)}.`
    case 'unrecognized_keys':
      return `This is not accepted here: ${iss.keys.join(', ')}.`
    case 'invalid_union':
    case 'invalid_key':
    case 'invalid_element':
      return 'This value is not valid.'
    default:
      return undefined // 'custom' and anything else: the schema's own message
  }
}
