// The client search's keywords (search-locations U1, BR-K1, BR-K2, P2): the examples the app route documented,
// and the bounds as properties.
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { isServiceToken, keywordsOf, MAX_SEARCH_TOKENS, SEARCH_STOP_WORDS, tokenize } from '../../src/modules/search/domain/keywords'

const terms = new Set(['nursing services', 'speech therapist', 'cleaning services', 'support worker'])

describe('tokenize (BR-K1)', () => {
  it.each([
    ['loves cooking', ['cooking']],
    ['likes swimming', ['swimming']],
    ['speech therapist', ['speech', 'therapist']],
    ['gardening nurse', ['gardening', 'nurse']],
    ['loves cooking pasta', ['cooking', 'pasta']],
    ['Cooking, music!', ['cooking', 'music']],
  ])('%s → %j', (q, tokens) => {
    expect(tokenize(q)).toEqual(tokens)
  })

  it('keeps the whole query when every word is a stop word', () => {
    expect(tokenize(' the and ')).toEqual(['the and'])
  })

  it('P2: at most five tokens, none short or a stop word, never empty', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim() !== ''), (q) => {
        const t = tokenize(q)
        expect(t.length).toBeGreaterThan(0)
        expect(t.length).toBeLessThanOrEqual(MAX_SEARCH_TOKENS)
        if (!(t.length === 1 && t[0] === q.trim())) for (const x of t) expect(x.length >= 2 && !SEARCH_STOP_WORDS.has(x)).toBe(true)
      }),
    )
  })
})

describe('isServiceToken (BR-K2)', () => {
  it.each([
    ['nurs', true], // inside "nursing services"
    ['cleaning', true],
    ['speech', true],
    ['cooking', false],
    ['swimming', false],
    ['the', false], // short tokens must equal a name
  ])('%s → %s', (token, expected) => {
    expect(isServiceToken(token, terms)).toBe(expected)
  })

  it('with no names (BR-K5), every token is text', () => {
    expect(keywordsOf('nurse cooking', new Set()).map((k) => k.kind)).toEqual(['text', 'text'])
  })
})
