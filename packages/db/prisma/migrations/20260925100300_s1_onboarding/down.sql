-- Drops the onboarding marker and its history.
--
-- What is lost: every stage and transition. The current stage is rebuildable
-- (scripts/backfill-worker-onboarding.ts derives it from documents and sign-in);
-- the exact transition times recorded by the API and reconciler are NOT -- a
-- rebuild approximates them. Export worker_onboarding_transitions first if that
-- history matters.
DROP TABLE "worker_onboarding_transitions";
DROP TABLE "worker_onboarding";
DROP TYPE "OnboardingTransitionSource";
DROP TYPE "OnboardingStage";
