// The one-wildcard-label allow-lists (config/hosts.ts, D11): what a `*.` admits
// and, more importantly, what it refuses. Production values are exact; only the
// staging stage table hands the api a wildcard.
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { hostAllowed, hostMatches, isHostPattern, isOriginPattern, originAllowed } from '../src/config/hosts'

describe('host patterns', () => {
  it('accepts exact hostnames and one leading wildcard label', () => {
    for (const p of ['localhost', 'app.remontaservices.com.au', '*.vercel.app', '*.preview.example.com']) expect(isHostPattern(p), p).toBe(true)
  })
  it('refuses anything else that looks like a wildcard', () => {
    for (const p of ['*', '*.app', '*.', 'a.*.b.com', 'app.*.com', '**.vercel.app', '*-x.vercel.app', 'https://x.com', 'x..com', '-x.com']) expect(isHostPattern(p), p).toBe(false)
  })
  it('a wildcard stands for exactly one non-empty label, case-insensitively', () => {
    expect(hostMatches('*.vercel.app', 'remonta-app-abc123-remontas-projects.vercel.app')).toBe(true)
    expect(hostMatches('*.vercel.app', 'Remonta-App.VERCEL.APP')).toBe(true)
    expect(hostMatches('*.vercel.app', 'vercel.app')).toBe(false)
    expect(hostMatches('*.vercel.app', 'a.b.vercel.app')).toBe(false)
    expect(hostMatches('*.vercel.app', 'evilvercel.app')).toBe(false)
    expect(hostMatches('*.vercel.app', 'x.vercel.app.evil.com')).toBe(false)
    expect(hostMatches('app.remontaservices.com.au', 'app.remontaservices.com.au')).toBe(true)
    expect(hostMatches('app.remontaservices.com.au', 'evil-app.remontaservices.com.au')).toBe(false)
  })
  it('property: a wildcard never admits a host with a dot inside the wild part, and an exact pattern admits only itself', () => {
    const label = fc.stringMatching(/^[a-z0-9]([a-z0-9-]{0,20}[a-z0-9])?$/)
    fc.assert(fc.property(label, label, (a, b) => hostMatches('*.vercel.app', `${a}.${b}.vercel.app`) === false))
    fc.assert(fc.property(label, (a) => hostMatches('*.vercel.app', `${a}.vercel.app`) === true))
    fc.assert(fc.property(label, (a) => hostMatches('app.example.com', `${a}.example.com`) === (a === 'app')))
  })
  it('hostAllowed: any pattern in the list', () => {
    expect(hostAllowed(['localhost', '*.vercel.app'], 'x.vercel.app')).toBe(true)
    expect(hostAllowed(['localhost'], 'x.vercel.app')).toBe(false)
  })
})

describe('origin patterns', () => {
  it('accepts exact origins (http only for localhost) and https wildcard origins without a port', () => {
    for (const o of ['https://app.remontaservices.com.au', 'http://localhost:3000', 'https://*.vercel.app']) expect(isOriginPattern(o), o).toBe(true)
    for (const o of ['*', 'http://*.vercel.app', 'https://*.vercel.app:443', 'https://*.vercel.app/x', 'http://app.example.com', 'https://app.example.com/x', 'https://*.app']) expect(isOriginPattern(o), o).toBe(false)
  })
  it('originAllowed: exact match, or one https label under a wildcard', () => {
    const list = ['http://localhost:3000', 'https://*.vercel.app']
    expect(originAllowed(list, 'http://localhost:3000')).toBe(true)
    expect(originAllowed(list, 'https://remonta-app-git-fix-x-remontas-projects.vercel.app')).toBe(true)
    expect(originAllowed(list, 'http://remonta-app.vercel.app')).toBe(false)
    expect(originAllowed(list, 'https://remonta-app.vercel.app:8443')).toBe(false)
    expect(originAllowed(list, 'https://a.b.vercel.app')).toBe(false)
    expect(originAllowed(list, 'https://vercel.app')).toBe(false)
    expect(originAllowed(list, 'https://x.vercel.app.evil.com')).toBe(false)
    expect(originAllowed(list, 'null')).toBe(false)
    expect(originAllowed(list, 'not an origin')).toBe(false)
    expect(originAllowed(['https://app.remontaservices.com.au'], 'https://app.remontaservices.com.au')).toBe(true)
    expect(originAllowed(['https://app.remontaservices.com.au'], 'https://app.remontaservices.com.au.evil.com')).toBe(false)
  })
})
