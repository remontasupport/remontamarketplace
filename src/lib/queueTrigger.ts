/**
 * Queue Trigger - Automatic Processing with Singleton Pattern
 * Prevents multiple processors from running simultaneously
 */

let processingLock = false;
let pendingTrigger: NodeJS.Timeout | null = null;

/**
 * Trigger queue processing (debounced and singleton)
 * Safe to call multiple times - only one processor will run
 */
export async function triggerQueueProcessing() {
  // If already processing, skip
  if (processingLock) {
    return;
  }

  // Clear any pending trigger
  if (pendingTrigger) {
    clearTimeout(pendingTrigger);
  }

  // Debounce: Wait 100ms to batch multiple submissions
  pendingTrigger = setTimeout(async () => {
    // Set lock
    processingLock = true;

    try {
      const url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      await fetch(`${url}/api/process-queue-direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error: any) {
      // Silently fail - Vercel cron will pick it up
    } finally {
      // Release lock
      processingLock = false;
    }
  }, 100); // 100ms debounce
}
