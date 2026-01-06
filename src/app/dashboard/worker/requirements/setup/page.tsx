"use client";

/**
 * Worker Compliance Setup - Multi-Step Form (Dynamic)
 * Single page with URL-based step navigation
 * Steps are generated dynamically from API requirements
 * Route: /dashboard/worker/requirements/setup?step=identity-point-100
 */

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { flushSync } from "react-dom";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StepContainer from "@/components/account-setup/shared/StepContainer";
import { useWorkerProfile, useUpdateProfileStep, workerProfileKeys } from "@/hooks/queries/useWorkerProfile";
import { useWorkerRequirements } from "@/hooks/queries/useWorkerRequirements";
import { generateComplianceSteps, findStepBySlug, getStepIndex } from "@/utils/dynamicComplianceSteps";
import { MANDATORY_REQUIREMENTS_SETUP_STEPS } from "@/config/mandatoryRequirementsSetupSteps";
import { autoUpdateComplianceCompletion } from "@/services/worker/setupProgress.service";
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
  // Step 1: Proof of Identity
  identityDocuments: UploadedDocument[];
  // ABN field
  abn: string;
}

function MandatoryRequirementsSetupContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepSlug = searchParams.get("step");

  // Fetch worker requirements to generate dynamic steps
  const { data: requirementsData, isLoading: isLoadingRequirements } = useWorkerRequirements();

  // Generate dynamic compliance steps from API data
  const dynamicSteps = useMemo(() => {
    return generateComplianceSteps(requirementsData);
  }, [requirementsData]);

  // Use dynamic steps if available, otherwise fallback to static
  const STEPS = dynamicSteps.length > 0 ? dynamicSteps : MANDATORY_REQUIREMENTS_SETUP_STEPS;

  // Determine the default step slug
  const defaultStepSlug = STEPS.length > 0 ? STEPS[0].slug : "worker-screening-check";
  const currentStepSlug = stepSlug || defaultStepSlug;

  // Find current step by slug
  const currentStepIndex = getStepIndex(STEPS, currentStepSlug);
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;
  const currentStepData = STEPS[currentStep - 1];

  // TanStack Query hooks
  const queryClient = useQueryClient();
  const { data: profileData, isLoading: isLoadingProfile } = useWorkerProfile(session?.user?.id);
  const updateProfileMutation = useUpdateProfileStep();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [isFinalSaving, setIsFinalSaving] = useState(false);

  // Track if we've initialized form data to prevent overwrites
  const hasInitializedFormData = useRef(false);

  // Form data state
  const [formData, setFormData] = useState<FormData>({
    identityDocuments: [],
    abn: "",
  });

  // Populate form data ONLY on initial load
  useEffect(() => {
    if (profileData && !hasInitializedFormData.current) {
      setFormData({
        identityDocuments: [], // Will be loaded from VerificationRequirement table
        abn: profileData.abn || "",
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

    // Validate ABN if this is the ABN step
    if (currentStepData?.documentId === "abn-contractor") {
      if (formData.abn && formData.abn.replace(/\s/g, "").length !== 11) {
        newErrors.abn = "Please enter a valid ABN";
      }
    }

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

      // Determine if this step needs to save data to the database
      const needsSaving = currentStepData?.documentId === "abn-contractor";

      // Save ABN if needed (await it to ensure it completes before navigation)
      if (needsSaving) {
        await updateProfileMutation.mutateAsync({
          userId: session.user.id,
          step: currentStep,
          data: {
            abn: formData.abn,
          },
        });
      }

      // Move to next step or finish
      if (!isFinalStep) {
        // Reset loading state before navigation
        setIsNavigating(false);

        // Navigate to next step
        const nextStepSlug = STEPS[currentStep].slug;
        router.push(`/dashboard/worker/requirements/setup?step=${nextStepSlug}`);
      } else {
        // LAST STEP COMPLETED - Wait for update with timeout (max 3 seconds)
        try {
          // Race between update and timeout - whichever finishes first
          await Promise.race([
            autoUpdateComplianceCompletion(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
          ]);
        } catch (err) {
          // If timeout or error, continue anyway (dashboard will poll)
          console.log('Update timed out or failed, navigating anyway');
        }

        // Invalidate cache to refresh data
        queryClient.invalidateQueries({
          queryKey: workerProfileKeys.all,
        });

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
      router.push(`/dashboard/worker/requirements/setup?step=${prevStepSlug}`);
    }
  };

  // Skip current step
  const handleSkip = () => {
    if (currentStep < STEPS.length) {
      const nextStepSlug = STEPS[currentStep].slug;
      router.push(`/dashboard/worker/requirements/setup?step=${nextStepSlug}`);
    }
  };

  // Redirect to first step if invalid slug
  useEffect(() => {
    if (currentStepIndex < 0 && STEPS.length > 0) {
      router.push(`/dashboard/worker/requirements/setup?step=${STEPS[0].slug}`);
    }
  }, [currentStepIndex, router, STEPS]);

  // Authentication is handled by layout - no need to check here
  if (status === "loading" || isLoadingProfile || isLoadingRequirements) {
    return (
      <DashboardLayout showProfileCard={false}>
        <div className="form-page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  // Get current step component
  const CurrentStepComponent = currentStepData?.component;

  if (!CurrentStepComponent || !currentStepData) {
    return null;
  }

  return (
    <DashboardLayout showProfileCard={false}>
      {!isFinalSaving ? (
        <StepContainer
          currentStep={currentStep}
          totalSteps={STEPS.length}
          stepTitle={currentStepData.title}
          sectionTitle="Compliance"
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSkip={handleSkip}
          isNextLoading={false}
          nextButtonText={currentStep === STEPS.length ? "Save" : "Next"}
          showSkip={false}
        >
          {/* Success Message */}
          {successMessage && (
            <div className="form-success-message" style={{ marginBottom: "1.5rem" }}>
              {successMessage}
            </div>
          )}

          {/* General Error */}
          {errors.general && (
            <div className="form-error-message" style={{ marginBottom: "1.5rem" }}>
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
          />
        </StepContainer>
      ) : (
        <LoadingOverlay isOpen={isFinalSaving} message="Saving compliance requirements..." />
      )}
    </DashboardLayout>
  );
}

// Wrap the component in Suspense to handle useSearchParams()
export default function MandatoryRequirementsSetupPage() {
  return (
    <Suspense fallback={
      <DashboardLayout showProfileCard={false}>
        <div className="form-page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    }>
      <MandatoryRequirementsSetupContent />
    </Suspense>
  );
}
