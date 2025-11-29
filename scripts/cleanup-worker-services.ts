/**
 * Cleanup Script: Delete all WorkerService records
 *
 * Run with: npx tsx scripts/cleanup-worker-services.ts
 */

import { authPrisma } from '../src/lib/auth-prisma';

async function cleanupWorkerServices() {
  console.log('🧹 Cleaning up WorkerService records...\n');

  try {
    const result = await authPrisma.workerService.deleteMany({});

    console.log(`✅ Deleted ${result.count} WorkerService records\n`);
    console.log('✨ Cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await authPrisma.$disconnect();
  }
}

cleanupWorkerServices()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
