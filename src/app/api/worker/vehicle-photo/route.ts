import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";

/**
 * GET /api/worker/vehicle-photo
 * Fetch vehicle photo from verification_requirements
 */
export async function GET(request: Request) {
  try {
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

    // Find vehicle photo requirement
    const requirement = await authPrisma.verificationRequirement.findFirst({
      where: {
        workerProfileId: workerProfile.id,
        requirementType: "vehicle-drivers-license",
      },
      select: {
        documentUrl: true,
      },
    });

    return NextResponse.json({
      photoUrl: requirement?.documentUrl || null,
    });
  } catch (error: any) {
    console.error("❌ Failed to fetch vehicle photo:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicle photo", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/worker/vehicle-photo
 * Remove vehicle photo from verification_requirements
 */
export async function DELETE(request: Request) {
  try {
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

    // Delete vehicle photo requirement
    await authPrisma.verificationRequirement.deleteMany({
      where: {
        workerProfileId: workerProfile.id,
        requirementType: "vehicle-drivers-license",
      },
    });

    console.log(`✅ Vehicle photo requirement deleted`);

    return NextResponse.json({
      success: true,
      message: "Vehicle photo removed successfully",
    });
  } catch (error: any) {
    console.error("❌ Failed to remove vehicle photo:", error);
    return NextResponse.json(
      { error: "Failed to remove vehicle photo", details: error.message },
      { status: 500 }
    );
  }
}
