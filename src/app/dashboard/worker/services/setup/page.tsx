"use client";

/**
 * Worker Services Setup - Multi-Step Form
 * Single page with URL-based step navigation
 * Route: /dashboard/worker/services/setup?step=services-offer|additional-training
 *
 * Follows the same pattern as Account Setup
 */

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StepContainer from "@/components/account-setup/shared/StepContainer";
import { useWorkerProfile, useUpdateProfileStep } from "@/hooks/queries/useWorkerProfile";
import { SERVICES_SETUP_STEPS } from "@/config/servicesSetupSteps";
import Loader from "@/components/ui/Loader";

// Use centralized step configuration
const STEPS = SERVICES_SETUP_STEPS;

// Form data interface
interface FormData {
  // Step 1: Services Offer
  services: string[];
  supportWorkerCategories: string[];
  // Step 2: Additional Training / Qualifications
  selectedQualifications: string[];
}

export default function ServicesSetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepSlug = searchParams.get("step") || "services-offer";

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
    services: [],
    supportWorkerCategories: [],
    selectedQualifications: [],
  });

  // Populate form data ONLY on initial load
  useEffect(() => {
    if (profileData && !hasInitializedFormData.current) {
      console.log("📋 Initializing services form data with profile:", profileData);

      setFormData({
        services: profileData.services || [],
        supportWorkerCategories: profileData.supportWorkerCategories || [],
        selectedQualifications: [], // Will be loaded from VerificationRequirement table later
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

  // Auto-save services to database
  const handleSaveServices = async (services: string[], supportWorkerCategories: string[]) => {
    if (!session?.user?.id) return;

    console.log("💾 Auto-saving services to database:", { services, supportWorkerCategories });

    try {
      await updateProfileMutation.mutateAsync({
        userId: session.user.id,
        step: 101, // Services Offer step
        data: {
          services,
          supportWorkerCategories,
        },
      });
      console.log("✅ Services auto-saved successfully");
    } catch (error) {
      console.error("❌ Failed to auto-save services:", error);
      throw error; // Re-throw so component can handle it
    }
  };

  // Validate current step
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (stepSlug) {
      case "services-offer":
        if (!formData.services || formData.services.length === 0) {
          newErrors.services = "Please select at least one service";
        }
        // If Support Worker is selected, require at least one category
        if (
          formData.services?.includes("Support Worker") &&
          (!formData.supportWorkerCategories || formData.supportWorkerCategories.length === 0)
        ) {
          newErrors.supportWorkerCategories = "Please select at least one support worker category";
        }
        break;
      // No other validation needed - ABN moved to Compliance
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

    try {
      // Map step number to API step number
      // Services are stored via step 1 in the services setup
      // We can use a separate endpoint or reuse the existing one
      // For now, let's create a new step number range (e.g., 100+)
      const apiStep = 100 + currentStep;

      // Only send relevant fields for each step to avoid overwriting other fields
      let dataToSend: any = {};

      switch (stepSlug) {
        case "services-offer":
          dataToSend = {
            services: formData.services,
            supportWorkerCategories: formData.supportWorkerCategories,
          };
          break;
        case "additional-training":
          dataToSend = {
            selectedQualifications: formData.selectedQualifications,
          };
          break;
        default:
          // For any other step, send the entire formData (fallback)
          dataToSend = formData;
      }

      console.log(`💾 Saving step ${currentStep} (API step ${apiStep}) with data:`, dataToSend);

      // Use mutation hook - automatically invalidates cache on success
      await updateProfileMutation.mutateAsync({
        userId: session.user.id,
        step: apiStep,
        data: dataToSend,
      });

      // Move to next step or finish
      if (currentStep < STEPS.length) {
        const nextStepSlug = STEPS[currentStep].slug;
        router.push(`/dashboard/worker/services/setup?step=${nextStepSlug}`);
      } else {
        // Last step completed
        setSuccessMessage("Services setup completed!");
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
      router.push(`/dashboard/worker/services/setup?step=${prevStepSlug}`);
    }
  };

  // Skip current step
  const handleSkip = () => {
    if (currentStep < STEPS.length) {
      const nextStepSlug = STEPS[currentStep].slug;
      router.push(`/dashboard/worker/services/setup?step=${nextStepSlug}`);
    }
  };

  // Redirect to first step if invalid slug
  useEffect(() => {
    if (currentStepIndex < 0) {
      router.push("/dashboard/worker/services/setup?step=services-offer");
    }
  }, [currentStepIndex, router]);

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

  return (
    <DashboardLayout showProfileCard={false}>
      <StepContainer
        currentStep={currentStep}
        totalSteps={STEPS.length}
        stepTitle={currentStepData.title}
        sectionTitle="Your services"
        sectionNumber="2"
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
          onSaveServices={stepSlug === "services-offer" ? handleSaveServices : undefined}
          errors={errors}
        />
      </StepContainer>
    </DashboardLayout>
  );
}
