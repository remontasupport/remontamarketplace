"use client";

/**
 * Worker Mandatory Requirements Setup - Multi-Step Form
 * Single page with URL-based step navigation
 * Route: /dashboard/worker/requirements/setup?step=proof-of-identity
 */

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StepContainer from "@/components/account-setup/shared/StepContainer";
import { useWorkerProfile, useUpdateProfileStep } from "@/hooks/queries/useWorkerProfile";
import { MANDATORY_REQUIREMENTS_SETUP_STEPS } from "@/config/mandatoryRequirementsSetupSteps";

// Use centralized step configuration
const STEPS = MANDATORY_REQUIREMENTS_SETUP_STEPS;

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
}

export default function MandatoryRequirementsSetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepSlug = searchParams.get("step") || "worker-screening-check";

  // Find current step by slug
  const currentStepIndex = STEPS.findIndex((s) => s.slug === stepSlug);
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
    identityDocuments: [],
  });

  // Populate form data ONLY on initial load
  useEffect(() => {
    if (profileData && !hasInitializedFormData.current) {
      console.log("📋 Initializing requirements form data with profile:", profileData);

      setFormData({
        identityDocuments: [], // Will be loaded from VerificationRequirement table
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

    // Validation is optional for requirements
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
      // Skip saving for proof-of-identity since it handles its own uploads
      // This is similar to how photo step works in account setup

      // Move to next step or finish
      if (currentStep < STEPS.length) {
        const nextStepSlug = STEPS[currentStep].slug;
        router.push(`/dashboard/worker/requirements/setup?step=${nextStepSlug}`);
      } else {
        // Last step completed
        setSuccessMessage("Mandatory requirements setup completed!");
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
    if (currentStepIndex < 0) {
      router.push("/dashboard/worker/requirements/setup?step=worker-screening-check");
    }
  }, [currentStepIndex, router]);

  if (status === "loading" || isLoadingProfile) {
    return (
      <DashboardLayout showProfileCard={false}>
        <div className="form-page-container">
          <p className="loading-text">Loading...</p>
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
      <StepContainer
        currentStep={currentStep}
        totalSteps={STEPS.length}
        stepTitle={currentStepData.title}
        sectionTitle="Mandatory requirements"
        sectionNumber="3"
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSkip={handleSkip}
        isNextLoading={false}
        nextButtonText={currentStep === STEPS.length ? "Complete Setup" : "Next"}
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
        />
      </StepContainer>
    </DashboardLayout>
  );
}
