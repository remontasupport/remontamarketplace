/**
 * Worker Police Check API
 *
 * GET /api/worker/police-check - Fetch police check document for current user
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

    // Fetch police check document
    const policeCheck = await authPrisma.verificationRequirement.findFirst({
      where: {
        workerProfileId: workerProfile.id,
        requirementType: "police-check",
      },
      select: {
        id: true,
        documentUrl: true,
        documentUploadedAt: true,
        status: true,
      },
    });

    if (!policeCheck || !policeCheck.documentUrl) {
      return NextResponse.json({ document: null });
    }

    return NextResponse.json({
      document: {
        id: policeCheck.id,
        documentType: "police-check",
        documentUrl: policeCheck.documentUrl,
        uploadedAt: policeCheck.documentUploadedAt?.toISOString() || new Date().toISOString(),
      },
    });

  } catch (error: any) {
 
    return NextResponse.json(
      {
        error: "Failed to fetch police check",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
