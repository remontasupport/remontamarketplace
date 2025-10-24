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

    // 3. Fetch worker profile
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
        age: true,
        gender: true,
        genderIdentity: true,
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
      },
    });

    if (!workerProfile) {
      return NextResponse.json(
        { error: "Worker profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(workerProfile);

  } catch (error: any) {
    console.error("Error fetching worker profile:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch profile",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
