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
