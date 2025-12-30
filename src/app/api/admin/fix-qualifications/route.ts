import { NextResponse } from "next/server";
import { authPrisma } from "@/lib/auth-prisma";
import { QUALIFICATION_TYPE_TO_NAME } from "@/utils/qualificationMapping";

/**
 * POST /api/admin/fix-qualifications
 * One-time migration to fix all qualification names in the database
 * Converts slugs (cert3-aged-care) to display names (Certificate 3 Aged Care)
 */
export async function POST(request: Request) {
  try {
    console.log("Starting qualification name fix...");

    // Get all verification requirements that might have incorrect names
    const requirements = await authPrisma.verificationRequirement.findMany({
      where: {
        isRequired: false, // Worker-selected qualifications
      },
      select: {
        id: true,
        requirementType: true,
        requirementName: true,
      },
    });

    console.log(`Found ${requirements.length} worker-selected qualifications`);

    let updatedCount = 0;
    let skippedCount = 0;
    const updates: Array<{ id: string; old: string | null; new: string }> = [];

    for (const req of requirements) {
      const correctName = QUALIFICATION_TYPE_TO_NAME[req.requirementType];

      if (!correctName) {
        console.log(`Unknown qualification type: ${req.requirementType}`);
        skippedCount++;
        continue;
      }

      // Check if name needs updating (either missing or is a slug)
      const needsUpdate =
        !req.requirementName ||
        req.requirementName.includes('-') ||
        req.requirementName !== correctName;

      if (needsUpdate) {
        await authPrisma.verificationRequirement.update({
          where: { id: req.id },
          data: { requirementName: correctName },
        });

        updates.push({
          id: req.id,
          old: req.requirementName,
          new: correctName,
        });

        console.log(`Updated: ${req.requirementType} → "${correctName}"`);
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Qualification names fixed successfully",
      stats: {
        total: requirements.length,
        updated: updatedCount,
        skipped: skippedCount,
      },
      updates,
    });

  } catch (error: any) {
    console.error("Error fixing qualification names:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fix qualification names",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
