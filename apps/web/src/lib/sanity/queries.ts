// GROQ queries for fetching articles from Sanity

// Get all published articles, ordered by date (newest first)
export const articlesQuery = `*[_type == "article" && !(_id in path("drafts.**"))] | order(publishedAt desc) {
  _id,
  title,
  slug,
  excerpt,
  "imageUrl": mainImage.asset->url,
  "author": author->name,
  publishedAt,
  readTime,
  featured
}`

// Get a single article by slug
export const articleBySlugQuery = `*[_type == "article" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  excerpt,
  body,
  "imageUrl": mainImage.asset->url,
  "author": author->name,
  publishedAt,
  readTime,
  featured
}`

// Get featured articles
export const featuredArticlesQuery = `*[_type == "article" && featured == true && !(_id in path("drafts.**"))] | order(publishedAt desc) [0...3] {
  _id,
  title,
  slug,
  excerpt,
  "imageUrl": mainImage.asset->url,
  "author": author->name,
  publishedAt,
  readTime,
  featured
}`

// Get featured worker profiles (for landing page)
export const featuredWorkerProfilesQuery = `*[_type == "workerProfile" && featured == true && !(_id in path("drafts.**"))] | order(displayOrder asc) {
  _id,
  name,
  slug,
  jobRole,
  "imageUrl": image.asset->url,
  "imageAlt": image.alt,
  languages,
  location,
  hasVehicleAccess,
  bio,
  featured,
  displayOrder
}`

// Get all worker profiles
export const workerProfilesQuery = `*[_type == "workerProfile" && !(_id in path("drafts.**"))] | order(displayOrder asc) {
  _id,
  name,
  slug,
  jobRole,
  "imageUrl": image.asset->url,
  "imageAlt": image.alt,
  languages,
  location,
  hasVehicleAccess,
  bio,
  featured,
  displayOrder
}`
