/**
 * Worker Other Requirements API
 *
 * GET /api/worker/other-requirements - Fetch all other requirements documents for current user
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

    // Fetch all other requirements documents
    const otherRequirements = await authPrisma.verificationRequirement.findMany({
      where: {
        workerProfileId: workerProfile.id,
        requirementType: "other-requirement",
      },
      select: {
        id: true,
        requirementName: true,
        documentUrl: true,
        documentUploadedAt: true,
        status: true,
      },
      orderBy: {
        documentUploadedAt: "desc", // Show most recent first
      },
    });

    if (!otherRequirements || otherRequirements.length === 0) {
      return NextResponse.json({ documents: [] });
    }

    // Transform to match frontend expected format
    const documents = otherRequirements.map((doc) => ({
      id: doc.id,
      documentType: "other-requirement",
      documentName: doc.requirementName,
      documentUrl: doc.documentUrl || "",
      uploadedAt: doc.documentUploadedAt?.toISOString() || new Date().toISOString(),
      status: doc.status,
    }));

    return NextResponse.json({ documents });

  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to fetch other requirements",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
