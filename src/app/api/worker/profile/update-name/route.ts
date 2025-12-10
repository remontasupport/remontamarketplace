import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";

/**
 * POST /api/worker/profile/update-name
 * Updates worker's name with dynamic middle name handling
 *
 * If middle name is provided and column doesn't exist:
 * - Adds middleName column to database
 * - Saves all three names
 *
 * If middle name is empty:
 * - Only saves firstName and lastName
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
    const { firstName, middleName, lastName } = body;

    // 3. Validation
    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    // 4. Check if middleName column exists in the database
    const columnExists = await checkMiddleNameColumnExists();

    // 5. If middle name is provided but column doesn't exist, create it
    if (middleName && middleName.trim() && !columnExists) {
      await addMiddleNameColumn();
    }

    // 6. Update worker profile
    const updateData: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    };

    // Only include middleName if provided and column exists
    if (middleName && middleName.trim()) {
      updateData.middleName = middleName.trim();
    }

    const updatedProfile = await authPrisma.workerProfile.update({
      where: {
        userId: session.user.id,
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Name updated successfully",
      profile: {
        firstName: updatedProfile.firstName,
        middleName: updatedProfile.middleName || null,
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

/**
 * Check if middleName column exists in worker_profiles table
 */
async function checkMiddleNameColumnExists(): Promise<boolean> {
  try {
    const result = await authPrisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'worker_profiles'
      AND column_name = 'middleName'
    `;

    return result.length > 0;
  } catch (error) {
  
    return false;
  }
}

/**
 * Add middleName column to worker_profiles table
 * PostgreSQL doesn't support AFTER keyword, so column is added at the end
 * The Prisma schema handles the ordering
 */
async function addMiddleNameColumn(): Promise<void> {
  try {
    // Add the column (PostgreSQL adds it at the end, but Prisma schema controls the logical order)
    await authPrisma.$executeRaw`
      ALTER TABLE "worker_profiles"
      ADD COLUMN "middleName" TEXT
    `;


  } catch (error: any) {
    // Check if column already exists (race condition)
    if (error.code === "42701") {
     
      return;
    }

  
    throw error;
  }
}
