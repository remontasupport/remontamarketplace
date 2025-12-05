import { NextResponse } from 'next/server'
import { getArticles } from '@/lib/sanity/client'

/**
 * GET /api/articles
 *
 * Public endpoint to fetch all published articles from Sanity CMS
 * Used by the newsroom and other pages to display article listings
 *
 * No authentication required (read-only, public data)
 */
export async function GET() {
  try {
    // Fetch all published articles from Sanity
    const articles = await getArticles()

    return NextResponse.json({
      success: true,
      articles,
      count: articles.length,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Articles API] Error fetching articles:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch articles',
        articles: [],
        count: 0
      },
      { status: 500 }
    )
  }
}
