// The old Edit Profile URLs and where they now live (U2 H4). Plain data with no imports:
// next.config.ts turns it into its redirects, and features/navigation/workerMenu.test.ts
// proves every destination is a page. The old pages are deleted in PR 4; until then these
// redirects run first, so nobody reaches them. PR 4 (2026-10-16) deleted the old pages; the redirects stay for old links.
export const PROFILE_HOME = '/dashboard/worker/profile'

/** [old route, query key, old value, new section slug] */
export const PROFILE_REDIRECTS: readonly (readonly [string, string, string, string])[] = [
  ['/dashboard/worker/account/setup', 'step', 'name', 'name'],
  ['/dashboard/worker/account/setup', 'step', 'photo', 'photo'],
  ['/dashboard/worker/account/setup', 'step', 'bio', 'bio'],
  ['/dashboard/worker/account/setup', 'step', 'address', 'address'],
  ['/dashboard/worker/account/setup', 'step', 'personal-info', 'date-of-birth'],
  ['/dashboard/worker/profile-building', 'section', 'preferred-hours', 'preferred-hours'],
  ['/dashboard/worker/profile-building', 'section', 'experience', 'experience'],
  ['/dashboard/worker/profile-building', 'section', 'bank-account', 'bank-account'],
  ['/dashboard/worker/profile-building', 'section', 'work-history', 'work-history'],
  ['/dashboard/worker/profile-building', 'section', 'education-training', 'education'],
  ['/dashboard/worker/profile-building', 'section', 'good-to-know', 'interests'],
  ['/dashboard/worker/profile-building', 'section', 'languages', 'languages'],
  ['/dashboard/worker/profile-building', 'section', 'cultural-background', 'cultural-background'],
  ['/dashboard/worker/profile-building', 'section', 'religion', 'religion'],
  ['/dashboard/worker/profile-building', 'section', 'interests-hobbies', 'interests'],
  ['/dashboard/worker/profile-building', 'section', 'about-me', 'about-me'],
  ['/dashboard/worker/profile-building', 'section', 'personality', 'personality'],
  ['/dashboard/worker/profile-building', 'section', 'my-preferences', 'preferences'],
]

/** In Next's redirects shape: the specific ones first, then each old page to the new index. */
export function profileRedirects() {
  return [
    ...PROFILE_REDIRECTS.map(([source, key, value, slug]) => ({ source, has: [{ type: 'query' as const, key, value }], destination: `${PROFILE_HOME}/${slug}`, permanent: false })),
    { source: '/dashboard/worker/account/setup', destination: `${PROFILE_HOME}/name`, permanent: false },
    { source: '/dashboard/worker/profile-building', destination: PROFILE_HOME, permanent: false },
  ]
}
