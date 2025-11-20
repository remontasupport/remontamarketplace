/**
 * Worker Screening Check API
 *
 * GET /api/worker/screening-check - Fetch screening check document for current user
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";

export async function GET() {
  try {
    // Authentication
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

    // Fetch screening check document
    const screeningCheck = await authPrisma.verificationRequirement.findFirst({
      where: {
        workerProfileId: workerProfile.id,
        requirementType: "worker-screening-check",
      },
      select: {
        id: true,
        documentUrl: true,
        documentUploadedAt: true,
        status: true,
      },
    });

    if (!screeningCheck || !screeningCheck.documentUrl) {
      return NextResponse.json({ document: null });
    }

    return NextResponse.json({
      document: {
        id: screeningCheck.id,
        documentType: "worker-screening-check",
        documentUrl: screeningCheck.documentUrl,
        uploadedAt: screeningCheck.documentUploadedAt?.toISOString() || new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error("❌ Error fetching screening check:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch screening check",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
