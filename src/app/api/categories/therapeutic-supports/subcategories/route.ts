import { NextResponse } from 'next/server'
import { authPrisma as prisma } from '@/lib/auth-prisma'

/**
 * GET /api/categories/therapeutic-supports/subcategories
 * Fetch all subcategories for Therapeutic Supports category
 */
export async function GET() {
  try {
    const subcategories = await prisma.subcategory.findMany({
      where: {
        categoryId: 'therapeutic-supports'
      },
      select: {
        id: true,
        name: true,
        requiresRegistration: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: subcategories
    })
  } catch (error) {
    console.error('Error fetching therapeutic subcategories:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch therapeutic subcategories'
      },
      { status: 500 }
    )
  }
}
