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

    // 3. Fetch worker profile with workerServices
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
        age: true,
        gender: true,
        languages: true,
        services: true,
        supportWorkerCategories: true,
        experience: true,
        introduction: true,
        qualifications: true,
        hasVehicle: true,
        funFact: true,
        hobbies: true,
        uniqueService: true,
        whyEnjoyWork: true,
        additionalInfo: true,
        photos: true,
        profileCompleted: true,
        isPublished: true,
        verificationStatus: true,
        abn: true,
        workerServices: {
          select: {
            categoryId: true,
            categoryName: true,
            subcategoryId: true,
            subcategoryName: true,
          },
        },
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
    let services: string[] = [];
    let supportWorkerCategories: string[] = [];

    if (workerProfile.workerServices && workerProfile.workerServices.length > 0) {
      // Use new WorkerService table data
    

      // Extract unique category names for services
      const categoryNames = new Set<string>();
      const subcategoryIds = new Set<string>();

      workerProfile.workerServices.forEach((ws) => {
        categoryNames.add(ws.categoryName);
        if (ws.subcategoryId) {
          subcategoryIds.add(ws.subcategoryId);
        }
      });

      services = Array.from(categoryNames);
      supportWorkerCategories = Array.from(subcategoryIds);
    } else {
      // Fallback to legacy arrays if workerServices is empty
    
      services = workerProfile.services || [];
      supportWorkerCategories = workerProfile.supportWorkerCategories || [];
    }

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
