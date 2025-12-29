/**
 * Subcategories API
 * GET /api/subcategories?categoryId=support-worker
 * Fetches all available subcategories for a given category
 */

import { NextResponse } from "next/server";
import { authPrisma } from "@/lib/auth-prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    if (!categoryId) {
      return NextResponse.json(
        { error: "categoryId parameter is required" },
        { status: 400 }
      );
    }

    // Fetch all subcategories for this category
    const subcategories = await authPrisma.subcategory.findMany({
      where: {
        categoryId: categoryId,
      },
      select: {
        id: true,
        name: true,
        requiresRegistration: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(subcategories, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    return NextResponse.json(
      { error: "Failed to fetch subcategories" },
      { status: 500 }
    );
  }
}
