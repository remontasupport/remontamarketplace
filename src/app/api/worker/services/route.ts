/**
 * Worker Services API
 * GET - Fetch worker's selected services with subcategories
 *
 * Uses Next.js unstable_cache with per-user tags so the server controls
 * freshness. After a save, revalidateTag() instantly invalidates this cache.
 */

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";

export const workerServicesCacheTag = (workerProfileId: string) =>
  `worker-services-${workerProfileId}`;

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
    }

    const tag = workerServicesCacheTag(workerProfile.id);

    // Cache the DB query server-side — invalidated via revalidateTag after saves
    const getCachedServices = unstable_cache(
      async () => {
        const workerServices = await authPrisma.workerService.findMany({
          where: { workerProfileId: workerProfile.id },
          select: {
            categoryId: true,
            categoryName: true,
            subcategoryIds: true,
            subcategoryNames: true,
          },
        });

        return workerServices.map((ws) => ({
          categoryId: ws.categoryId,
          categoryName: ws.categoryName,
          subcategories: ws.subcategoryIds.map((id, index) => ({
            subcategoryId: id,
            subcategoryName: ws.subcategoryNames[index] || "",
          })),
        }));
      },
      [tag],
      { tags: [tag] }
    );

    const services = await getCachedServices();
    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
