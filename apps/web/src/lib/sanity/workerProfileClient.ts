import { client } from './config'
import { workerProfilesQuery, featuredWorkerProfilesQuery } from './queries'

export interface WorkerProfile {
  _id: string
  name: string
  slug: { current: string }
  jobRole: string
  imageUrl?: string
  imageAlt?: string
  languages: string[]
  location: string
  hasVehicleAccess: boolean
  bio: string
  featured?: boolean
  displayOrder: number
}

// Fetch all worker profiles
export async function getWorkerProfiles(): Promise<WorkerProfile[]> {
  try {
    const profiles = await client.fetch(workerProfilesQuery)
    return profiles
  } catch (error) {
    console.error('Error fetching worker profiles:', error)
    return []
  }
}

// Fetch featured worker profiles (for landing page)
export async function getFeaturedWorkerProfiles(): Promise<WorkerProfile[]> {
  try {
    const profiles = await client.fetch(featuredWorkerProfilesQuery)
    return profiles
  } catch (error) {
    console.error('Error fetching featured worker profiles:', error)
    return []
  }
}
