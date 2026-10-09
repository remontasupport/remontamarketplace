// The experience vocabulary (admin-search, experience sub-areas, 2026-10-09): the five
// care domains and the specific areas a worker can tick under each one. The worker's
// edit-profile page offers these labels and `worker_experience.specificAreas` stores
// them as written, so the admin search filters by the same strings. One list, read by
// the page, the api contract and the dashboard; nothing else may spell an area.
//
// `domain` is packages/db's CareDomain enum spelled out (this package never imports
// Prisma, P-5); `slug` is the key the edit-profile page has always used.

export const EXPERIENCE_DOMAINS = [
  {
    domain: 'AGED_CARE',
    slug: 'aged-care',
    label: 'Aged Care',
    areas: ["Dementia", "Parkinson's Disease", "Alzheimer's Disease", "Stroke Recovery"],
  },
  {
    domain: 'CHRONIC_MEDICAL',
    slug: 'chronic-medical',
    label: 'Chronic medical conditions',
    areas: ['Arthritis', 'COPD or Respiratory Illness', 'Asthma', 'Diabetes', 'Cardiovascular Disease'],
  },
  {
    domain: 'DISABILITY',
    slug: 'disability',
    label: 'Disability',
    areas: [
      'Acquired Brain Injury',
      'Autism',
      'Cerebral Palsy',
      'Cystic Fibrosis',
      'Down Syndrome',
      'Epilepsy',
      'Hearing Impairment',
      'Intellectual Disabilities',
      'Motor Neuron Disease',
      'Muscular Dystrophy',
      'Physical Disabilities',
      'Spina Bifida',
      'Spinal Cord Injury',
      'Vision Impairment',
    ],
  },
  {
    domain: 'MENTAL_HEALTH',
    slug: 'mental-health',
    label: 'Mental health',
    areas: [
      'Anxiety',
      'Bipolar Disorder',
      'Depression',
      'Eating Disorders',
      'Hoarding',
      'Obsessive-Compulsive Disorder (OCD)',
      'Post-traumatic Stress Disorder (PTSD)',
      'Schizophrenia',
      'Substance Abuse & Addiction',
    ],
  },
  {
    domain: 'WORKING_WITH_CHILDREN',
    slug: 'working-with-children',
    label: 'Working with Children',
    areas: [
      'Children with Disabilities',
      'Children with Behavioral Challenges',
      'Children with Learning Difficulties',
      'Children with Autism',
      'Children with ADHD',
      'Children with Developmental Delays',
      'Siblings of Children with Disabilities',
    ],
  },
] as const

export type ExperienceDomainCode = (typeof EXPERIENCE_DOMAINS)[number]['domain']
export type ExperienceDomainSlug = (typeof EXPERIENCE_DOMAINS)[number]['slug']

/** The separator of a `DOMAIN:Area` pair as the admin search's query carries it. */
export const EXPERIENCE_AREA_SEPARATOR = ':'

/** `DOMAIN:Area` for every area, in the order above: the admin search's closed vocabulary. */
export const EXPERIENCE_AREA_PAIRS = EXPERIENCE_DOMAINS.flatMap((d) => d.areas.map((a) => `${d.domain}${EXPERIENCE_AREA_SEPARATOR}${a}`)) as readonly string[]

/** The areas of a domain by its code; an unknown code has none. */
export function experienceAreasOf(domain: string): readonly string[] {
  return EXPERIENCE_DOMAINS.find((d) => d.domain === domain)?.areas ?? []
}

/** The areas keyed by the edit-profile page's slug (`aged-care` -> [...]). */
export const EXPERIENCE_AREAS_BY_SLUG = Object.fromEntries(EXPERIENCE_DOMAINS.map((d) => [d.slug, d.areas])) as unknown as Readonly<Record<ExperienceDomainSlug, readonly string[]>>

/** A pair split back: `AGED_CARE:Dementia` -> { domain, area }; null when it is not one of ours. */
export function splitExperienceAreaPair(pair: string): { domain: ExperienceDomainCode; area: string } | null {
  const i = pair.indexOf(EXPERIENCE_AREA_SEPARATOR)
  if (i < 0) return null
  const domain = pair.slice(0, i)
  const area = pair.slice(i + 1)
  const d = EXPERIENCE_DOMAINS.find((x) => x.domain === domain)
  if (!d || !(d.areas as readonly string[]).includes(area)) return null
  return { domain: d.domain, area }
}
