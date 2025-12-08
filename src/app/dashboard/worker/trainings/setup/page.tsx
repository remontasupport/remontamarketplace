"use client";

/**
 * Worker Trainings Setup - Multi-Step Form (Dynamic)
 * Single page with URL-based step navigation
 * Steps are generated dynamically from API trainings array
 * Route: /dashboard/worker/trainings/setup?step=training-slug
 */

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StepContainer from "@/components/account-setup/shared/StepContainer";
import { useWorkerProfile, useUpdateProfileStep } from "@/hooks/queries/useWorkerProfile";
import { useWorkerRequirements } from "@/hooks/queries/useWorkerRequirements";
import { generateTrainingSteps, findStepBySlug, getStepIndex } from "@/utils/dynamicTrainingSteps";
import Loader from "@/components/ui/Loader";

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
  const { data: profileData, isLoading: isLoadingProfile } = useWorkerProfile(session?.user?.id);
  const updateProfileMutation = useUpdateProfileStep();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Track if we've initialized form data to prevent overwrites
  const hasInitializedFormData = useRef(false);

  // Form data state
  const [formData, setFormData] = useState<FormData>({
    trainingDocuments: [],
  });

  // Populate form data ONLY on initial load
  useEffect(() => {
    if (profileData && !hasInitializedFormData.current) {
      console.log("📋 Initializing trainings form data with profile:", profileData);

      setFormData({
        trainingDocuments: [], // Will be loaded from VerificationRequirement table
      });
      hasInitializedFormData.current = true;
    }
  }, [profileData]);

  // Handle field change
  const handleFieldChange = (field: string, value: any) => {
    console.log(`📝 Field changed: ${field} =`, value);

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

    try {
      // Move to next step or finish
      if (currentStep < STEPS.length) {
        const nextStepSlug = STEPS[currentStep].slug;
        router.push(`/dashboard/worker/trainings/setup?step=${nextStepSlug}`);
      } else {
        // Last step completed
        setSuccessMessage("Thank you for submitting your documents. Someone from our team will review them shortly");
        setTimeout(() => {
          router.push("/dashboard/worker");
        }, 2000);
      }
    } catch (error) {
      console.error("Error saving step:", error);
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

  // Redirect to first step if invalid slug
  useEffect(() => {
    if (currentStepIndex < 0 && STEPS.length > 0) {
      router.push(`/dashboard/worker/trainings/setup?step=${STEPS[0].slug}`);
    }
  }, [currentStepIndex, router, STEPS]);

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
    return (
      <DashboardLayout showProfileCard={false}>
        <div className="form-page-container">
          <p className="loading-text">No trainings required at this time.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout showProfileCard={false}>
      <StepContainer
        currentStep={currentStep}
        totalSteps={STEPS.length}
        stepTitle={currentStepData.title}
        sectionTitle="Trainings"
        sectionNumber="4"
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSkip={handleSkip}
        isNextLoading={updateProfileMutation.isPending}
        nextButtonText={currentStep === STEPS.length ? "Complete Setup" : "Next"}
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
        />
      </StepContainer>
    </DashboardLayout>
  );
}

// Wrap the component in Suspense to handle useSearchParams()
export default function TrainingsSetupPage() {
  return (
    <Suspense fallback={
      <DashboardLayout showProfileCard={false}>
        <div className="form-page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    }>
      <TrainingsSetupContent />
    </Suspense>
  );
}
