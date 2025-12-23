import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";

/**
 * POST /api/worker/profile/update-name
 * Updates worker's first and last name
 */
export async function POST(request: Request) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { firstName, lastName } = body;

    // 3. Validation
    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    // 4. Update worker profile
    const updatedProfile = await authPrisma.workerProfile.update({
      where: {
        userId: session.user.id,
      },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Name updated successfully",
      profile: {
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
      },
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to update name",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
