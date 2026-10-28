// The client search's keywords (BR-K1, BR-K2), ported unchanged from apps/app's /api/client/workers route
// (search-locations U1). Pure: the service names come in as a set.

/**
 * Stop words stripped from search queries before tokenization: common English stop words and "intent" words
 * (loves, likes, wants), so that "loves cooking" → ["cooking"] and "likes swimming" → ["swimming"].
 */
export const SEARCH_STOP_WORDS: ReadonlySet<string> = new Set([
  // Intent / filler words users type to describe what they want
  'love', 'loves', 'like', 'likes', 'want', 'wants', 'need', 'needs',
  'enjoy', 'enjoys', 'find', 'looking', 'someone',
  // English stop words
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'they', 'their',
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'has', 'have', 'had',
  'a', 'an', 'the', 'and', 'or', 'but', 'not',
  'who', 'what', 'where', 'when', 'how',
  'that', 'this', 'these', 'those',
  'can', 'will', 'would', 'could', 'should', 'may', 'might',
  'with', 'for', 'of', 'to', 'in', 'on', 'at', 'by', 'from', 'into',
])

/** Cap on the number of tokens processed per query, so one query cannot explode into many conditions. */
export const MAX_SEARCH_TOKENS = 5

/**
 * "loves cooking" → ["cooking"]; "speech therapist" → ["speech", "therapist"]. If every word is a stop word, the
 * whole trimmed query is the one token.
 */
export function tokenize(query: string): string[] {
  const tokens = query
    .trim()
    .split(/[\s,]+/)
    .map((word) => word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())
    .filter((word) => word.length >= 2 && !SEARCH_STOP_WORDS.has(word))
    .slice(0, MAX_SEARCH_TOKENS)
  return tokens.length > 0 ? tokens : [query.trim()]
}

/**
 * A service token names a category or sub-category: equal to a name, or (4+ characters) inside one.
 * "nurse" is inside "nursing services"; "cooking" is in none, so it is a text token.
 */
export function isServiceToken(token: string, serviceTerms: ReadonlySet<string>): boolean {
  const t = token.toLowerCase()
  if (serviceTerms.has(t)) return true
  if (t.length >= 4) {
    for (const term of serviceTerms) if (term.includes(t)) return true
  }
  return false
}

export interface Keyword {
  token: string
  kind: 'service' | 'text'
}

export function keywordsOf(search: string, serviceTerms: ReadonlySet<string>): Keyword[] {
  return tokenize(search).map((token) => ({ token, kind: isServiceToken(token, serviceTerms) ? 'service' : 'text' }))
}
