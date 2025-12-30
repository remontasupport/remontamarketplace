/**
 * Database Migration Script: Fix Qualification Names
 * Updates verification_requirements table to use proper display names
 * Run this once to fix existing data
 *
 * Usage: npx tsx src/scripts/fixQualificationNames.ts
 */

import { authPrisma } from "@/lib/auth-prisma";
import { QUALIFICATION_TYPE_TO_NAME } from "@/utils/qualificationMapping";

async function fixQualificationNames() {
  console.log("Starting qualification name fix...\n");

  try {
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

    console.log(`Found ${requirements.length} worker-selected qualifications\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const req of requirements) {
      const correctName = QUALIFICATION_TYPE_TO_NAME[req.requirementType];

      if (!correctName) {
        console.log(`⚠️  Unknown qualification type: ${req.requirementType}`);
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

        console.log(`✅ Updated: ${req.requirementType} → "${correctName}"`);
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`\n✨ Migration complete!`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Total: ${requirements.length}`);

  } catch (error) {
    console.error("❌ Error during migration:", error);
    throw error;
  } finally {
    await authPrisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  fixQualificationNames()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { fixQualificationNames };
