/**
 * Worker Services API
 * GET - Fetch worker's selected services with subcategories
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get worker profile
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
    }

    // Fetch worker's selected services with subcategories
    const workerServices = await authPrisma.workerService.findMany({
      where: {
        workerProfileId: workerProfile.id,
      },
      select: {
        categoryId: true,
        categoryName: true,
        subcategoryId: true,
        subcategoryName: true,
      },
    });

    // Group by category
    const servicesMap = new Map<string, {
      categoryId: string;
      categoryName: string;
      subcategories: Array<{ subcategoryId: string; subcategoryName: string }>;
    }>();

    workerServices.forEach((ws) => {
      const key = ws.categoryId;

      if (!servicesMap.has(key)) {
        servicesMap.set(key, {
          categoryId: ws.categoryId,
          categoryName: ws.categoryName,
          subcategories: [],
        });
      }

      if (ws.subcategoryId && ws.subcategoryName) {
        servicesMap.get(key)!.subcategories.push({
          subcategoryId: ws.subcategoryId,
          subcategoryName: ws.subcategoryName,
        });
      }
    });

    const services = Array.from(servicesMap.values());

    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
