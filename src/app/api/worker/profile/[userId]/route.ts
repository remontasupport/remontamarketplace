import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";
import {
  checkComplianceCompletion,
  checkTrainingsCompletion,
  checkServicesCompletion,
  checkAccountDetailsCompletion,
} from "@/services/worker/setupProgress.service";

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
        middleName: true,
        lastName: true,
        mobile: true,
        location: true,
        city: true,
        state: true,
        postalCode: true,
        photos: true, // Profile photo URL
        introduction: true, // Bio
        age: true,
        dateOfBirth: true,
        gender: true,
        hasVehicle: true,
        abn: true,
        profileCompleted: true,
        isPublished: true,
        verificationStatus: true,
        setupProgress: true,
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

    // Fetch verification requirements to populate documentsByService
    const verificationRequirements = await authPrisma.verificationRequirement.findMany({
      where: { workerProfileId: workerProfile.id },
      select: {
        requirementType: true,
        metadata: true,
      },
    });

    // Transform verification requirements into documentsByService format
    // Format: Record<serviceName, Record<requirementType, string[]>>
    const documentsByService: Record<string, Record<string, string[]>> = {};

    for (const requirement of verificationRequirements) {
      const metadata = requirement.metadata as any;
      const serviceTitle = metadata?.serviceTitle;
      const documentUrls = metadata?.documentUrls || [];

      if (serviceTitle && documentUrls.length > 0) {
        if (!documentsByService[serviceTitle]) {
          documentsByService[serviceTitle] = {};
        }
        documentsByService[serviceTitle][requirement.requirementType] = documentUrls;
      }
    }

    // OPTIMIZED: Calculate setupProgress in REAL-TIME from database state
    // This eliminates race conditions and ensures progress is ALWAYS accurate
    // No more stale cache issues - progress reflects actual data!
    const [
      accountDetailsResult,
      complianceResult,
      trainingsResult,
      servicesResult,
    ] = await Promise.all([
      checkAccountDetailsCompletion(),
      checkComplianceCompletion(),
      checkTrainingsCompletion(),
      checkServicesCompletion(),
    ]);

    // Construct real-time setupProgress from actual database state
    const realTimeSetupProgress = {
      accountDetails: accountDetailsResult.success ? (accountDetailsResult.data || false) : false,
      compliance: complianceResult.success ? (complianceResult.data || false) : false,
      trainings: trainingsResult.success ? (trainingsResult.data || false) : false,
      services: servicesResult.success ? (servicesResult.data || false) : false,
      additionalCredentials: false, // Not implemented yet
    };

    // Return profile data with REAL-TIME calculated progress (not cached JSON!)
    return NextResponse.json({
      ...workerProfile,
      services,
      supportWorkerCategories,
      documentsByService,
      setupProgress: realTimeSetupProgress, // Override cached JSON with real-time calculation
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
