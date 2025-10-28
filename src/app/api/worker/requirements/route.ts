/**
 * Worker Requirements API
 * Fetches verification requirements for a worker
 *
 * GET /api/worker/requirements?serviceTitle={title}
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";
import { getQualificationsForService } from "@/config/serviceQualificationRequirements";

export async function GET(request: Request) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get query params
    const { searchParams } = new URL(request.url);
    const serviceTitle = searchParams.get("serviceTitle");

    if (!serviceTitle) {
      return NextResponse.json(
        { error: "serviceTitle query parameter is required" },
        { status: 400 }
      );
    }

    // 3. Get worker profile
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
    }

    // 4. Get qualifications for this service
    const qualifications = getQualificationsForService(serviceTitle);
    const qualificationTypes = qualifications.map((q) => q.type);

    // 5. Fetch existing requirements for these qualification types
    const requirements = await authPrisma.verificationRequirement.findMany({
      where: {
        workerProfileId: workerProfile.id,
        requirementType: {
          in: qualificationTypes,
        },
      },
      select: {
        id: true,
        requirementType: true,
        requirementName: true,
        documentUrl: true,
        documentUploadedAt: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      serviceTitle,
      requirements,
    });
  } catch (error: any) {
    console.error("❌ Failed to fetch requirements:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch requirements",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
