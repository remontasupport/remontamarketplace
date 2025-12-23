/**
 * Queue Service using pg-boss
 *
 * Uses your existing PostgreSQL database as a queue - NO EXTRA SERVER NEEDED!
 *
 * Features:
 * - Automatic retries on failure
 * - Job persistence (survives server restarts)
 * - Concurrent processing
 * - Dead letter queue for failed jobs
 * - Built-in monitoring
 */

import PgBoss from 'pg-boss';
import { authPrisma } from './auth-prisma';
import { randomUUID } from 'crypto';

// Queue configuration
const QUEUE_CONFIG = {
  // Connection
  connectionString: process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL,

  // Performance tuning for high concurrency
  max: 10, // Max database connections for queue

  // Schema management - IMPORTANT for fixing null return issue
  schema: 'pgboss', // Explicitly set schema name

  // Clock skew tolerance - CRITICAL FIX for null return issue
  // Set to maximum allowed value to minimize clock checks
  clockMonitorIntervalMinutes: 10, // Check every 10 minutes (max allowed)

  // Archive settings - prevent jobs from expiring due to clock skew
  archiveCompletedAfterSeconds: 60 * 60 * 24, // Keep completed jobs for 24 hours

  // Monitoring
  monitorStateIntervalSeconds: 60, // Check queue health every 60s
};

// Singleton instance
let bossInstance: PgBoss | null = null;

/**
 * Get database time to avoid clock skew issues
 */
async function getDatabaseTime(): Promise<Date> {
  try {
    const result = await authPrisma.$queryRaw<any[]>`SELECT NOW() as db_time`;
    return new Date(result[0].db_time);
  } catch (error) {
   
    return new Date();
  }
}

/**
 * Get or create PgBoss instance
 */
export async function getQueueInstance(): Promise<PgBoss> {
  if (bossInstance) {
    return bossInstance;
  }

  bossInstance = new PgBoss(QUEUE_CONFIG);

  // Handle errors
  bossInstance.on('error', (error) => {

  });

  // Start the queue manager
  try {
    await bossInstance.start();

    // Set database timezone to UTC to fix clock skew issues
    try {
      const db = (bossInstance as any).db;
      if (db && db.pool) {
        await db.executeSql('SET TIME ZONE \'UTC\'');
      }
    } catch (tzError) {
      // Ignore timezone errors
    }

    // Wait for schema initialization to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (startError: any) {
    bossInstance = null;
    throw startError;
  }

  return bossInstance;
}

/**
 * Gracefully stop the queue
 */
export async function stopQueue(): Promise<void> {
  if (bossInstance) {
    await bossInstance.stop();
    bossInstance = null;
  }
}

// ============================================
// JOB DEFINITIONS
// ============================================

/**
 * Worker Registration Job Data
 */
export interface WorkerRegistrationJobData {
  // User credentials
  email: string;
  password: string;

  // Personal info
  firstName: string;
  lastName: string;
  mobile: string;

  // Worker details
  location?: string;

  // Services
  services?: string[]; // Selected service category IDs
  supportWorkerCategories?: string[]; // Selected support worker subcategory IDs

  // Geocoded location (if already geocoded)
  geocodedLocation?: {
    city: string | null;
    state: string | null;
    postalCode: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}

/**
 * Job Types
 */
export const JOB_TYPES = {
  WORKER_REGISTRATION: 'worker-registration',
} as const;

// ============================================
// QUEUE OPERATIONS
// ============================================

/**
 * Add worker registration job to queue (direct DB insertion)
 * FALLBACK: Due to clock skew issues, we insert directly into pgboss.job table
 *
 * @param data - Worker registration data
 * @returns Job ID
 */
export async function queueWorkerRegistration(
  data: WorkerRegistrationJobData
): Promise<string> {
  try {
    // Get database time to avoid clock skew
    const dbTime = await getDatabaseTime();

    // Generate UUID for job ID
    const jobId = randomUUID();

    // Direct database insertion - bypasses pg-boss.send() to avoid clock skew issues
    await authPrisma.$executeRaw`
      INSERT INTO pgboss.job (
        id,
        name,
        data,
        state,
        retry_limit,
        retry_delay,
        retry_backoff,
        start_after,
        created_on,
        keep_until,
        priority
      )
      VALUES (
        ${jobId}::uuid,
        ${JOB_TYPES.WORKER_REGISTRATION},
        ${JSON.stringify(data)}::jsonb,
        'created',
        3,
        60,
        true,
        NOW(),
        NOW(),
        NOW() + INTERVAL '72 hours',
        0
      )
    `;

    return jobId;

  } catch (error: any) {

    throw error;
  }
}

/**
 * Get job status (direct DB query to avoid pg-boss issues)
 */
export async function getJobStatus(jobId: string): Promise<any> {
  try {
    const result = await authPrisma.$queryRawUnsafe<any[]>(`
      SELECT id, name, state, priority, retry_limit, retry_count,
             start_after, started_on, created_on, completed_on, keep_until
      FROM pgboss.job
      WHERE id = '${jobId}'
      LIMIT 1
    `);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    return null;
  }
}

/**
 * Cancel a job
 */
export async function cancelJob(jobId: string): Promise<void> {
  const boss = await getQueueInstance();
  await boss.cancel(jobId);
}

// ============================================
// QUEUE MONITORING
// ============================================

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  active: number;
  created: number;
  completed: number;
  failed: number;
  retry: number;
}> {
  const boss = await getQueueInstance();

  const [active, created, completed, failed, retry] = await Promise.all([
    boss.getQueueSize(JOB_TYPES.WORKER_REGISTRATION, { state: 'active' }),
    boss.getQueueSize(JOB_TYPES.WORKER_REGISTRATION, { state: 'created' }),
    boss.getQueueSize(JOB_TYPES.WORKER_REGISTRATION, { state: 'completed' }),
    boss.getQueueSize(JOB_TYPES.WORKER_REGISTRATION, { state: 'failed' }),
    boss.getQueueSize(JOB_TYPES.WORKER_REGISTRATION, { state: 'retry' }),
  ]);

  return { active, created, completed, failed, retry };
}
