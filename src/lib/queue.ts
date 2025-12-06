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

// Queue configuration
const QUEUE_CONFIG = {
  // Connection
  connectionString: process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL,

  // Performance tuning for high concurrency
  max: 10, // Max database connections for queue

  // Monitoring
  monitorStateIntervalSeconds: 60, // Check queue health every 60s
};

// Singleton instance
let bossInstance: PgBoss | null = null;

/**
 * Get or create PgBoss instance
 */
export async function getQueueInstance(): Promise<PgBoss> {
  if (bossInstance) {
    console.log('♻️ Reusing existing queue instance');
    return bossInstance;
  }

  console.log('🔧 Creating new queue instance...');
  console.log('🔗 Database URL exists:', !!(process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL));

  bossInstance = new PgBoss(QUEUE_CONFIG);

  // Handle errors with detailed logging
  bossInstance.on('error', (error) => {
    console.error('❌ pg-boss error event:', error);
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
  });

  // Monitor state changes
  bossInstance.on('monitor-states', (stats) => {
    console.log('📊 Queue stats:', stats);
  });

  // Start the queue manager
  console.log('⚙️ Starting queue manager...');

  try {
    await bossInstance.start();
    console.log('✅ Queue service started successfully');
  } catch (startError: any) {
    console.error('❌ Failed to start pg-boss:', startError);
    bossInstance = null; // Clear failed instance
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
    bossInstance = null; // Clear singleton so it can be recreated
    console.log('✅ Queue service stopped');
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
  age?: number;
  gender?: string;
  languages?: string[];
  services?: string[];
  supportWorkerCategories?: string[];
  experience?: string;
  introduction?: string;
  qualifications?: string;
  hasVehicle?: string;
  funFact?: string;
  hobbies?: string;
  uniqueService?: string;
  whyEnjoyWork?: string;
  additionalInfo?: string;
  photos?: string[]; // Photo URLs
  consentProfileShare?: boolean;
  consentMarketing?: boolean;

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
 * Add worker registration job to queue
 *
 * @param data - Worker registration data
 * @returns Job ID
 */
export async function queueWorkerRegistration(
  data: WorkerRegistrationJobData
): Promise<string> {
  try {
    const boss = await getQueueInstance();

    console.log('📤 Attempting to queue registration for:', data.email);

    // Send job to queue (removed singletonKey which was causing null returns)
    const jobId = await boss.send(
      JOB_TYPES.WORKER_REGISTRATION,
      data,
      {
        // Job options
        retryLimit: 3,
        retryDelay: 60,
        retryBackoff: true,
        expireIn: '1 day', // Jobs expire after 1 day if not completed
        priority: 0, // Priority (higher = processed first)
      }
    );

    if (!jobId) {
      console.error('❌ boss.send() returned null/undefined');
      console.error('❌ This usually means pg-boss had an internal error');
      throw new Error('Failed to queue worker registration - boss.send returned null. Check database connection.');
    }

    console.log('✅ Job queued successfully:', jobId);
    return jobId;

  } catch (error: any) {
    console.error('❌ Error in queueWorkerRegistration:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
    });
    throw error;
  }
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<any> {
  const boss = await getQueueInstance();
  return await boss.getJobById(jobId);
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
