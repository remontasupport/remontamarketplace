/**
 * Cleanup Script: Delete all WorkerService records
 *
 * Run with: npx tsx scripts/cleanup-worker-services.ts
 */

import { authPrisma } from '../src/lib/auth-prisma';

async function cleanupWorkerServices() {
  
  try {
    const result = await authPrisma.workerService.deleteMany({});
  } catch (error) {
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
    process.exit(1);
  });
