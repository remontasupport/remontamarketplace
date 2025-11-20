/**
 * Worker NDIS Training API
 *
 * GET /api/worker/ndis-training - Fetch NDIS training document for current user
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

    // Fetch NDIS training document
    const ndisTraining = await authPrisma.verificationRequirement.findFirst({
      where: {
        workerProfileId: workerProfile.id,
        requirementType: "ndis-training",
      },
      select: {
        id: true,
        documentUrl: true,
        documentUploadedAt: true,
        status: true,
      },
    });

    if (!ndisTraining || !ndisTraining.documentUrl) {
      return NextResponse.json({ document: null });
    }

    return NextResponse.json({
      document: {
        id: ndisTraining.id,
        documentType: "ndis-training",
        documentUrl: ndisTraining.documentUrl,
        uploadedAt: ndisTraining.documentUploadedAt?.toISOString() || new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error("❌ Error fetching NDIS training:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch NDIS training",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
