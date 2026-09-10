import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

// Sanity project configuration
export const config = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '98ycfc5t',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production',
}

// Validate configuration
if (!config.projectId || config.projectId === '') {
  throw new Error(
    'Missing NEXT_PUBLIC_SANITY_PROJECT_ID environment variable. Please add it to your .env file.'
  )
}

// Create Sanity client
export const client = createClient(config)

// Image URL builder helper
const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}
