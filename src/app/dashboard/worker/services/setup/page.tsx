"use client";

/**
 * Worker Services Setup - Multi-Step Form with Dynamic Service Steps
 * Route: /dashboard/worker/services/setup?step=[slug]
 *
 * Flow: [Service 1] → [Service 2] → ... → Other Documents
 * Example: Support Worker → Cleaning Services → Other Documents
 */

import { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StepContainer from "@/components/account-setup/shared/StepContainer";
import { useWorkerProfile, useUpdateProfileStep } from "@/hooks/queries/useWorkerProfile";
import { generateServicesSetupSteps, SERVICES_SETUP_STEPS } from "@/config/servicesSetupSteps";
import Loader from "@/components/ui/Loader";

// Form data interface
interface FormData {
  // Individual service qualifications
  qualificationsByService: Record<string, string[]>;
  // Individual service skills
  skillsByService: Record<string, string[]>;
  // Track which service is showing skills view
  currentServiceShowingSkills: string | null;
  // Other documents step
  selectedQualifications: string[];
}

function ServicesSetupContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepSlug = searchParams.get("step") || "";

  // Fetch profile data
  const { data: profileData, isLoading: isLoadingProfile } = useWorkerProfile(session?.user?.id);
  const updateProfileMutation = useUpdateProfileStep();

  // Track if we've initialized form data
  const hasInitializedFormData = useRef(false);

  // Form data state
  const [formData, setFormData] = useState<FormData>({
    qualificationsByService: {},
    skillsByService: {},
    currentServiceShowingSkills: null,
    selectedQualifications: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Generate dynamic steps based on selected services
  const STEPS = profileData?.services && profileData.services.length > 0
    ? generateServicesSetupSteps(profileData.services)
    : SERVICES_SETUP_STEPS;

  // Find current step by slug
  const currentStepIndex = STEPS.findIndex((s) => s.slug === stepSlug);
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;
  const currentStepData = STEPS[currentStep - 1];

  // Populate form data ONLY on initial load
  useEffect(() => {
    if (profileData && !hasInitializedFormData.current) {
      setFormData({
        qualificationsByService: profileData.qualificationsByService || {},
        skillsByService: profileData.skillsByService || {},
        currentServiceShowingSkills: null,
        selectedQualifications: [],
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
    // No validation needed for service qualification steps or other documents
    return true;
  };

  // Save current step and move to next
  const handleNext = async () => {
    // Import serviceHasSkills function
    const { serviceHasSkills } = await import("@/config/serviceSkills");

    // INTERCEPTOR: Check if we're on a service step with skills
    // Only intercept if:
    // 1. We have a serviceTitle (it's a service step, not "Other Documents")
    // 2. We're NOT currently showing skills view
    // 3. The service has skills configured
    const isServiceStep = !!currentStepData?.serviceTitle;
    const isShowingSkills = formData.currentServiceShowingSkills === currentStepData?.serviceTitle;
    const hasSkills = isServiceStep && serviceHasSkills(currentStepData.serviceTitle!);

    if (isServiceStep && !isShowingSkills && hasSkills) {
      // INTERCEPT: Show skills view instead of proceeding to next service
      handleFieldChange("currentServiceShowingSkills", currentStepData.serviceTitle);
      return; // Don't proceed - just show skills
    }

    // PROCEED: Either no skills, or already showed skills, or not a service step
    // Validate current step
    if (!validateStep()) {
      return;
    }

    if (!session?.user?.id) return;

    try {
      const apiStep = 100 + currentStep;
      let dataToSend: any = {};

      // Determine what data to send based on current step
      if (stepSlug === "other-documents") {
        dataToSend = {
          selectedQualifications: formData.selectedQualifications,
        };
      } else {
        // Individual service step - save qualifications AND skills
        dataToSend = {
          qualificationsByService: formData.qualificationsByService,
          skillsByService: formData.skillsByService,
        };
      }

      // Save to database
      await updateProfileMutation.mutateAsync({
        userId: session.user.id,
        step: apiStep,
        data: dataToSend,
      });

      // Clear skills view state before moving to next step
      if (formData.currentServiceShowingSkills) {
        handleFieldChange("currentServiceShowingSkills", null);
      }

      // Move to next step or go to Additional Documents (Section 3)
      if (currentStep < STEPS.length) {
        const nextStepSlug = STEPS[currentStep].slug;
        router.push(`/dashboard/worker/services/setup?step=${nextStepSlug}`);
      } else {
        // All services completed - redirect to Additional Documents (Section 3)
        setSuccessMessage("Services qualifications & skills completed!");
        setTimeout(() => {
          router.push("/dashboard/worker/additional-documents");
        }, 1500);
      }
    } catch (error) {
      setErrors({ general: "Failed to save. Please try again." });
    }
  };

  // Go to previous step
  const handlePrevious = () => {
    // If we're currently showing skills view, go back to qualifications view
    if (formData.currentServiceShowingSkills) {
      handleFieldChange("currentServiceShowingSkills", null);
      return;
    }

    // Otherwise, navigate to previous step
    if (currentStep > 1) {
      const prevStepSlug = STEPS[currentStep - 2].slug;
      router.push(`/dashboard/worker/services/setup?step=${prevStepSlug}`);
    }
  };

  // Redirect to first step if no step specified or invalid slug
  useEffect(() => {
    if (!stepSlug && STEPS.length > 0) {
      // No step specified - redirect to first step
      router.push(`/dashboard/worker/services/setup?step=${STEPS[0].slug}`);
    } else if (currentStepIndex < 0 && STEPS.length > 0) {
      // Invalid step - redirect to first step
      router.push(`/dashboard/worker/services/setup?step=${STEPS[0].slug}`);
    } else if (STEPS.length === 0) {
      // No services selected - redirect to Edit Services page
      router.push("/dashboard/worker/services/manage");
    }
  }, [currentStepIndex, router, stepSlug, STEPS]);

  // Reset skills view state when navigating to a different step (e.g., via sidebar)
  useEffect(() => {
    // Always start with qualifications view when landing on a step
    if (formData.currentServiceShowingSkills) {
      handleFieldChange("currentServiceShowingSkills", null);
    }
  }, [stepSlug]); // Reset whenever stepSlug changes

  // Loading state
  if (status === "loading" || isLoadingProfile) {
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

  // Prepare props for current step
  const stepProps: any = {
    data: formData,
    onChange: handleFieldChange,
    errors: errors,
  };

  // Add service-specific props
  if (currentStepData.serviceTitle) {
    stepProps.serviceTitle = currentStepData.serviceTitle;
  }

  return (
    <DashboardLayout showProfileCard={false}>
      <StepContainer
        currentStep={currentStep}
        totalSteps={STEPS.length}
        stepTitle={currentStepData.title}
        sectionTitle="Your services"
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSkip={() => {}}
        isNextLoading={false}
        nextButtonText={currentStep === STEPS.length ? "Complete" : "Next"}
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
        <CurrentStepComponent {...stepProps} />
      </StepContainer>
    </DashboardLayout>
  );
}

// Wrap in Suspense to handle useSearchParams()
export default function ServicesSetupPage() {
  return (
    <Suspense fallback={
      <DashboardLayout showProfileCard={false}>
        <div className="form-page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    }>
      <ServicesSetupContent />
    </Suspense>
  );
}
