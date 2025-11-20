/**
 * Worker Working With Children Check API
 *
 * GET /api/worker/working-with-children - Fetch working with children check document for current user
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

    // Fetch working with children check document
    const wwcCheck = await authPrisma.verificationRequirement.findFirst({
      where: {
        workerProfileId: workerProfile.id,
        requirementType: "working-with-children",
      },
      select: {
        id: true,
        documentUrl: true,
        documentUploadedAt: true,
        status: true,
      },
    });

    if (!wwcCheck || !wwcCheck.documentUrl) {
      return NextResponse.json({ document: null });
    }

    return NextResponse.json({
      document: {
        id: wwcCheck.id,
        documentType: "working-with-children",
        documentUrl: wwcCheck.documentUrl,
        uploadedAt: wwcCheck.documentUploadedAt?.toISOString() || new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error("❌ Error fetching working with children check:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch working with children check",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
