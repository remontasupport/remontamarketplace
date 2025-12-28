import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";

/**
 * GET /api/worker/profile/[userId]
 * Fetches worker profile data
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { userId } = await params;

    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Verify user is accessing their own profile
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: "Forbidden - You can only access your own profile" },
        { status: 403 }
      );
    }

    // 3. Fetch worker profile (without workerServices relation for performance)
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        mobile: true,
        location: true,
        city: true,
        state: true,
        postalCode: true,
        age: true,
        gender: true,
        languages: true,
        experience: true,
        introduction: true,
        qualifications: true,
        hasVehicle: true,
        funFact: true,
        hobbies: true,
        uniqueService: true,
        photos: true,
        profileCompleted: true,
        isPublished: true,
        verificationStatus: true,
        consentProfileShare: true,
        consentMarketing: true,
      },
    });

    if (!workerProfile) {
      return NextResponse.json(
        { error: "Worker profile not found" },
        { status: 404 }
      );
    }

    // Transform workerServices data to match the legacy format
    // This ensures backward compatibility with existing components
    // OPTIMIZED: Use database aggregation (groupBy) instead of fetching all records and iterating in JS
    // This leverages the index on [workerProfileId, categoryName] for performance
    let services: string[] = [];
    let supportWorkerCategories: string[] = [];

    const [categoryGroups, subcategoryGroups] = await Promise.all([
      authPrisma.workerService.groupBy({
        by: ['categoryName'],
        where: { workerProfileId: workerProfile.id },
      }),
      authPrisma.workerService.groupBy({
        by: ['subcategoryId'],
        where: {
          workerProfileId: workerProfile.id,
          subcategoryId: { not: null }
        },
      }),
    ]);

    // Use WorkerService table data (normalized structure)
    services = categoryGroups.map(g => g.categoryName);
    supportWorkerCategories = subcategoryGroups
      .map(g => g.subcategoryId)
      .filter((id): id is string => id !== null);

    // Return profile data with transformed services
    return NextResponse.json({
      ...workerProfile,
      services,
      supportWorkerCategories,
    });

  } catch (error: any) {
   

    return NextResponse.json(
      {
        error: "Failed to fetch profile",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
