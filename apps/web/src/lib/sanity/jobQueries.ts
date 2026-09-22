import { client } from './config'

export interface Job {
  _id: string
  title: string
  slug: {
    current: string
  }
  location: string
  description: string
  certificates: string
  availability: string
  active: boolean
  postedAt: string
  startDate: string
}

// Get all active jobs
export async function getJobs(): Promise<Job[]> {
  const query = `*[_type == "job" && active == true && !(_id in path("drafts.**"))] | order(postedAt desc) {
    _id,
    title,
    slug,
    location,
    description,
    certificates,
    availability,
    active,
    postedAt,
    startDate
  }`

  return client.fetch(query)
}

// Get single job by slug
export async function getJobBySlug(slug: string): Promise<Job | null> {
  const query = `*[_type == "job" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    location,
    description,
    certificates,
    active,
    postedAt
  }`

  return client.fetch(query, { slug })
}

// Get featured/active jobs (you can modify the criteria)
export async function getFeaturedJobs(limit: number = 3): Promise<Job[]> {
  const query = `*[_type == "job" && active == true && !(_id in path("drafts.**"))] | order(postedAt desc) [0...${limit}] {
    _id,
    title,
    slug,
    location,
    description,
    certificates,
    active,
    postedAt
  }`

  return client.fetch(query)
}
