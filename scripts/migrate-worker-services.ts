/**
 * Data Migration Script: Migrate Worker Services
 *
 * This script migrates existing worker service data from the services and
 * supportWorkerCategories arrays in WorkerProfile to the new WorkerService table.
 *
 * Run with: npx ts-node scripts/migrate-worker-services.ts
 */

import { authPrisma } from '../src/lib/auth-prisma';

async function migrateWorkerServices() {
  console.log('🚀 Starting worker services migration...\n');

  try {
    // 1. Fetch all worker profiles with services
    const workerProfiles = await authPrisma.workerProfile.findMany({
      select: {
        id: true,
        userId: true,
        services: true,
        supportWorkerCategories: true,
      },
    });

    console.log(`📊 Found ${workerProfiles.length} worker profiles to migrate\n`);

    let totalServicesCreated = 0;
    let profilesProcessed = 0;

    // 2. Process each worker profile
    for (const profile of workerProfiles) {
      const services = profile.services || [];
      const subcategories = profile.supportWorkerCategories || [];

      if (services.length === 0) {
        console.log(`⏭️  Skipping profile ${profile.id} (no services)`);
        continue;
      }

      console.log(`\n👤 Processing profile: ${profile.id}`);
      console.log(`   Services: ${services.join(', ')}`);
      console.log(`   Subcategories: ${subcategories.join(', ')}`);

      const workerServiceRecords = [];

      // 3. Create WorkerService records
      for (const serviceName of services) {
        const categoryId = serviceName.toLowerCase().replace(/\s+/g, '-');

        // Check if this service requires subcategories
        const needsSubcategories =
          serviceName === "Therapeutic Supports" ||
          serviceName === "Support Worker (High Intensity)";

        if (needsSubcategories && subcategories && subcategories.length > 0) {
          // Create a WorkerService for each subcategory
          for (const subcategoryName of subcategories) {
            if (subcategoryName && subcategoryName.trim()) {
              const subcategoryId = subcategoryName.toLowerCase().replace(/\s+/g, '-');

              workerServiceRecords.push({
                workerProfileId: profile.id,
                categoryId,
                categoryName: serviceName,
                subcategoryId,
                subcategoryName,
              });
            }
          }
        } else {
          // Create a single WorkerService for the category (no subcategory)
          workerServiceRecords.push({
            workerProfileId: profile.id,
            categoryId,
            categoryName: serviceName,
            subcategoryId: null,
            subcategoryName: null,
          });
        }
      }

      // 4. Insert WorkerService records
      if (workerServiceRecords.length > 0) {
        try {
          await authPrisma.workerService.createMany({
            data: workerServiceRecords,
            skipDuplicates: true, // Skip if already exists
          });

          console.log(`   ✅ Created ${workerServiceRecords.length} WorkerService records`);
          totalServicesCreated += workerServiceRecords.length;
          profilesProcessed++;
        } catch (error: any) {
          console.error(`   ❌ Error creating WorkerService records:`, error.message);
        }
      }
    }

    console.log('\n\n📈 Migration Summary:');
    console.log(`   Profiles processed: ${profilesProcessed}`);
    console.log(`   WorkerService records created: ${totalServicesCreated}`);
    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await authPrisma.$disconnect();
  }
}

// Run the migration
migrateWorkerServices()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
