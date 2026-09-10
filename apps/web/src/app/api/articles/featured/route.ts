import { NextResponse } from 'next/server'
import { getFeaturedArticles } from '@/lib/sanity/client'

/**
 * GET /api/articles/featured
 *
 * Public endpoint to fetch featured articles from Sanity CMS
 * Returns up to 3 featured articles
 *
 * No authentication required (read-only, public data)
 */
export async function GET() {
  try {
    // Fetch featured articles from Sanity
    const articles = await getFeaturedArticles()

    return NextResponse.json({
      success: true,
      articles,
      count: articles.length,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Featured Articles API] Error fetching featured articles:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch featured articles',
        articles: [],
        count: 0
      },
      { status: 500 }
    )
  }
}
