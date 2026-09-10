import { NextResponse } from 'next/server'
import { getArticleBySlug } from '@/lib/sanity/client'

/**
 * GET /api/articles/[slug]
 *
 * Public endpoint to fetch a single article by its slug from Sanity CMS
 * Includes full article body content (Portable Text)
 *
 * No authentication required (read-only, public data)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Slug parameter is required',
          article: null
        },
        { status: 400 }
      )
    }

    // Fetch article by slug from Sanity
    const article = await getArticleBySlug(slug)

    if (!article) {
      return NextResponse.json(
        {
          success: false,
          error: 'Article not found',
          article: null
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      article,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Article API] Error fetching article:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch article',
        article: null
      },
      { status: 500 }
    )
  }
}
