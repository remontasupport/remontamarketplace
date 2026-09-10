import { client } from './config'
import { articlesQuery, articleBySlugQuery, featuredArticlesQuery } from './queries'

export interface Article {
  _id: string
  title: string
  slug: { current: string }
  excerpt: string
  imageUrl?: string
  author: string
  publishedAt: string
  readTime: string
  featured?: boolean
  body?: any // Portable Text content
}

// Fetch all articles
export async function getArticles(): Promise<Article[]> {
  try {
    const articles = await client.fetch(articlesQuery)
    return articles
  } catch (error) {
    console.error('Error fetching articles:', error)
    return []
  }
}

// Fetch a single article by slug
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const article = await client.fetch(articleBySlugQuery, { slug })
    return article
  } catch (error) {
    console.error('Error fetching article:', error)
    return null
  }
}

// Fetch featured articles
export async function getFeaturedArticles(): Promise<Article[]> {
  try {
    const articles = await client.fetch(featuredArticlesQuery)
    return articles
  } catch (error) {
    console.error('Error fetching featured articles:', error)
    return []
  }
}
