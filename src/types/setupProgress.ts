/**
 * Setup Progress Types
 * Types for tracking worker setup progress across different sections
 */

export type SetupSection = "account-details" | "compliance" | "trainings" | "services";

export interface SetupProgress {
  accountDetails: boolean;
  compliance: boolean;
  trainings: boolean;
  services: boolean;
}

export const DEFAULT_SETUP_PROGRESS: SetupProgress = {
  accountDetails: false,
  compliance: false,
  trainings: false,
  services: false,
};

/**
 * Helper to parse setupProgress from database (JSONB)
 * Handles null/undefined and provides defaults
 */
export function parseSetupProgress(progress: any): SetupProgress {
  if (!progress || typeof progress !== "object") {
    return { ...DEFAULT_SETUP_PROGRESS };
  }

  return {
    accountDetails: progress.accountDetails ?? false,
    compliance: progress.compliance ?? false,
    trainings: progress.trainings ?? false,
    services: progress.services ?? false,
  };
}

/**
 * Check if all sections are completed
 */
export function isAllSectionsCompleted(progress: SetupProgress): boolean {
  return (
    progress.accountDetails &&
    progress.compliance &&
    progress.trainings &&
    progress.services
  );
}

/**
 * Get section completion percentage (0-100)
 */
export function getCompletionPercentage(progress: SetupProgress): number {
  const completed = Object.values(progress).filter(Boolean).length;
  const total = Object.keys(progress).length;
  return Math.round((completed / total) * 100);
}
