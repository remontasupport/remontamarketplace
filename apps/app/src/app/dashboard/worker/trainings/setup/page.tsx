"use client";

/**
 * Worker Trainings Setup - Multi-Step Form (Dynamic)
 * Single page with URL-based step navigation
 * Steps are generated dynamically from API trainings array
 * Route: /dashboard/worker/trainings/setup?step=training-slug
 */

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { flushSync } from "react-dom";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StepContainer from "@/components/account-setup/shared/StepContainer";
import { useWorkerProfile as useApiProfile } from "@/features/worker/profile";
import { setupProfileOf } from "@/features/worker/compliance";
import { useWorkerRequirements } from "@/hooks/queries/useWorkerRequirements";
import { generateTrainingSteps, findStepBySlug, getStepIndex } from "@/utils/dynamicTrainingSteps";
import Loader from "@/components/ui/Loader";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

// Form data interface
interface UploadedDocument {
  id?: string;
  documentType: string;
  documentUrl: string;
  uploadedAt: string;
}

interface FormData {
  trainingDocuments: UploadedDocument[];
}

function TrainingsSetupContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepSlug = searchParams.get("step");

  // Fetch worker requirements to generate dynamic steps
  const { data: requirementsData, isLoading: isLoadingRequirements } = useWorkerRequirements();

  // Generate dynamic training steps from API data
  const dynamicSteps = useMemo(() => {
    return generateTrainingSteps(requirementsData);
  }, [requirementsData]);

  // Use dynamic steps
  const STEPS = dynamicSteps;

  // Determine the default step slug
  const defaultStepSlug = STEPS.length > 0 ? STEPS[0].slug : "training";
  const currentStepSlug = stepSlug || defaultStepSlug;

  // Find current step by slug
  const currentStepIndex = getStepIndex(STEPS, currentStepSlug);
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;
  const currentStepData = STEPS[currentStep - 1];

  // TanStack Query hooks
  // The api's profile read (U5b).
  const { profile: apiProfile, isLoading: isLoadingProfile, reload: reloadProfile } = useApiProfile();
  const profileData = useMemo(() => (apiProfile ? setupProfileOf(apiProfile) : undefined), [apiProfile]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [isFinalSaving, setIsFinalSaving] = useState(false);

  // Track if we've initialized form data to prevent overwrites
  const hasInitializedFormData = useRef(false);

  // Form data state
  const [formData, setFormData] = useState<FormData>({
    trainingDocuments: [],
  });

  // Populate form data ONLY on initial load
  useEffect(() => {
    if (profileData && !hasInitializedFormData.current) {
      setFormData({
        trainingDocuments: [], // Will be loaded from VerificationRequirement table
      });
      hasInitializedFormData.current = true;
    }
  }, [profileData]);

  // Handle field change
  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate current step
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validation is optional for trainings
    // Documents are uploaded via their own API endpoints

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save current step and move to next
  const handleNext = async () => {
    // Validate current step
    if (!validateStep()) {
      return;
    }

    if (!session?.user?.id) return;

    // Check if this is the final step
    const isFinalStep = currentStep === STEPS.length;

    try {
      // Show appropriate loading state BEFORE any async operations
      if (isFinalStep) {
        // Use flushSync to force immediate synchronous render
        flushSync(() => {
          setIsFinalSaving(true);
        });
      } else {
        setIsNavigating(true);
      }

      // Move to next step or finish
      if (!isFinalStep) {
        // Reset loading state before navigation
        setIsNavigating(false);

        // Navigate to next step
        const nextStepSlug = STEPS[currentStep].slug;
        router.push(`/dashboard/worker/trainings/setup?step=${nextStepSlug}`);
      } else {
        // LAST STEP COMPLETED: apps/api recomputed and stored completion with every upload (U5b: the
        // autoUpdateTrainingsCompletion action is gone); the dashboard reads it fresh.
        await reloadProfile();

        // Force Next.js to invalidate server cache and refetch on next navigation
        router.refresh();

        // Navigate (data should be updated now)
        router.push("/dashboard/worker");
      }
    } catch (error) {
      setIsNavigating(false);
      setIsFinalSaving(false);
      setErrors({ general: "Failed to save. Please try again." });
    }
  };

  // Go to previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      const prevStepSlug = STEPS[currentStep - 2].slug;
      router.push(`/dashboard/worker/trainings/setup?step=${prevStepSlug}`);
    }
  };

  // Skip current step
  const handleSkip = () => {
    if (currentStep < STEPS.length) {
      const nextStepSlug = STEPS[currentStep].slug;
      router.push(`/dashboard/worker/trainings/setup?step=${nextStepSlug}`);
    }
  };

  // Redirect to first step if invalid slug; a document folded into a combined step (CPR) goes to that step
  useEffect(() => {
    if (currentStepIndex < 0 && STEPS.length > 0) {
      const host = STEPS.find((s) => s.parts?.some((p) => p.id === stepSlug)) ?? STEPS[0];
      router.replace(`/dashboard/worker/trainings/setup?step=${host.slug}`);
    }
  }, [currentStepIndex, router, STEPS, stepSlug]);

  // Extract primary service for role display
  const primaryService = profileData?.services?.[0] || 'Support Worker';

  // Authentication is handled by layout - no need to check here
  if (status === "loading" || isLoadingProfile || isLoadingRequirements) {
    return (
      <DashboardLayout
        showProfileCard={false}
        profileData={{
          firstName: profileData?.firstName || 'Worker',
          photo: profileData?.photos || null,
          role: primaryService,
        }}
      >
        <div className="form-page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    );
  }
  // No services chosen: the api lists no steps (R4.1, U5b) -- the services come first.
  if (STEPS.length === 0) {
    return (
      <DashboardLayout showProfileCard={false}>
        <div className="form-page-container">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-8 text-center font-poppins">
            <p className="text-gray-700">Choose the services you offer first: your trainings depend on them.</p>
            <a href="/dashboard/worker/account?tab=services" className="mt-4 inline-block font-semibold underline" style={{ color: "#0C1628" }}>
              Choose your services
            </a>
          </div>
        </div>
      </DashboardLayout>
    );
  }


  // Get current step component
  const CurrentStepComponent = currentStepData?.component;

  if (!CurrentStepComponent || !currentStepData) {
    return (
      <DashboardLayout
        showProfileCard={false}
        profileData={{
          firstName: profileData?.firstName || 'Worker',
          photo: profileData?.photos || null,
          role: primaryService,
        }}
      >
        <div className="form-page-container">
          <p className="loading-text">No trainings required at this time.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      showProfileCard={false}
      profileData={{
        firstName: profileData?.firstName || 'Worker',
        photo: profileData?.photos || null,
        role: primaryService,
      }}
    >
      {!isFinalSaving ? (
        <StepContainer
          currentStep={currentStep}
          totalSteps={STEPS.length}
          stepTitle={currentStepData.title}
          sectionTitle="Trainings"
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSkip={handleSkip}
          isNextLoading={false}
          nextButtonText={currentStep === STEPS.length ? "Save" : "Next"}
          showSkip={false}
        >
          {/* Success Message */}
          {successMessage && (
            <div className="form-success-message">
              {successMessage}
            </div>
          )}

          {/* General Error */}
          {errors.general && (
            <div className="form-error-message">
              {errors.general}
            </div>
          )}

          {/* Render current step */}
          <CurrentStepComponent
            data={formData}
            onChange={handleFieldChange}
            errors={errors}
            // Pass additional props for dynamic components
            requirement={currentStepData?.requirement}
            apiEndpoint={currentStepData?.apiEndpoint}
            parts={currentStepData?.parts}
          />
        </StepContainer>
      ) : (
        <LoadingOverlay isOpen={isFinalSaving} message="Saving your trainings..." />
      )}
    </DashboardLayout>
  );
}

// Wrap the component in Suspense to handle useSearchParams()
export default function TrainingsSetupPage() {
  return (
    <Suspense fallback={
      <DashboardLayout
        showProfileCard={false}
        profileData={{
          firstName: 'Worker',
          photo: null,
          role: 'Support Worker',
        }}
      >
        <div className="form-page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    }>
      <TrainingsSetupContent />
    </Suspense>
  );
}
