"use client";

/**
 * Worker Services Setup - Multi-Step Form with Dynamic Service Steps
 * Route: /dashboard/worker/services/setup?step=[slug]
 *
 * Flow: [Service 1] → [Service 2] → ... → Other Documents
 * Example: Support Worker → Cleaning Services → Other Documents
 */

import { useState, useEffect, useLayoutEffect, useMemo, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StepContainer from "@/components/account-setup/shared/StepContainer";
import { useWorkerProfile, useUpdateProfileStep } from "@/hooks/queries/useWorkerProfile";
import { generateServicesSetupSteps, SERVICES_SETUP_STEPS } from "@/config/servicesSetupSteps";
import { serviceHasQualifications } from "@/config/serviceQualificationRequirements";
import { serviceHasSkills } from "@/config/serviceSkills";
import Loader from "@/components/ui/Loader";

// Form data interface
interface FormData {
  // Individual service qualifications
  qualificationsByService: Record<string, string[]>;
  // Individual service skills
  skillsByService: Record<string, string[]>;
  // Documents by service and requirement type (URLs)
  documentsByService: Record<string, Record<string, string[]>>;
  // Other documents step
  selectedQualifications: string[];
}

function ServicesSetupContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepSlug = searchParams.get("step") || "";
  const viewParam = searchParams.get("view") || ""; // URL-based view state

  // Fetch profile data
  const { data: profileData, isLoading: isLoadingProfile } = useWorkerProfile(session?.user?.id);
  const updateProfileMutation = useUpdateProfileStep();

  // Track if we've initialized form data
  const hasInitializedFormData = useRef(false);

  // Form data state (view tracking moved to URL params)
  const [formData, setFormData] = useState<FormData>({
    qualificationsByService: {},
    skillsByService: {},
    documentsByService: {},
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

  // Compute current view PURELY from URL + service configuration (100% deterministic!)
  const currentView = useMemo(() => {
    const serviceTitle = currentStepData?.serviceTitle;
    if (!serviceTitle) {
      return { view: 'default' as const, serviceTitle: null };
    }

    // Priority 1: Use explicit view from URL if present
    if (viewParam === 'skills') {
      return { view: 'skills' as const, serviceTitle };
    }
    if (viewParam === 'documents') {
      return { view: 'documents' as const, serviceTitle };
    }
    if (viewParam === 'qualifications') {
      return { view: 'qualifications' as const, serviceTitle };
    }

    // Priority 2: Auto-determine initial view based on service configuration
    const hasQualifications = serviceHasQualifications(serviceTitle);
    const hasSkills = serviceHasSkills(serviceTitle);

    // Auto-show skills if no qualifications but has skills
    if (!hasQualifications && hasSkills) {
      return { view: 'skills' as const, serviceTitle };
    }

    // Default: qualifications view
    return { view: 'qualifications' as const, serviceTitle };
  }, [stepSlug, viewParam, currentStepData?.serviceTitle]);

  console.log('[ServicesSetup] Computed currentView (URL-based):', {
    stepSlug,
    viewParam,
    serviceTitle: currentStepData?.serviceTitle,
    currentView,
  });

  // Populate form data ONLY on initial load
  useEffect(() => {
    if (profileData && !hasInitializedFormData.current) {
      setFormData({
        qualificationsByService: profileData.qualificationsByService || {},
        skillsByService: profileData.skillsByService || {},
        documentsByService: profileData.documentsByService || {},
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
    // Import serviceHasSkills function and getServiceDocumentRequirements
    const { serviceHasSkills } = await import("@/config/serviceSkills");
    const { getServiceDocumentRequirements } = await import("@/config/serviceDocumentRequirements");

    // INTERCEPTOR 1: Check if we're on a service step with skills
    // Only intercept if:
    // 1. We have a serviceTitle (it's a service step, not "Other Documents")
    // 2. We're NOT currently showing skills view
    // 3. We're NOT currently showing documents view
    // 4. The service has skills configured
    const isServiceStep = !!currentStepData?.serviceTitle;
    const isShowingSkills = currentView.view === 'skills';
    const isShowingDocuments = currentView.view === 'documents';
    const hasSkills = isServiceStep && serviceHasSkills(currentStepData.serviceTitle!);

    if (isServiceStep && !isShowingSkills && !isShowingDocuments && hasSkills) {
      // INTERCEPT: Navigate to skills view via URL
      router.push(`/dashboard/worker/services/setup?step=${stepSlug}&view=skills`);
      return;
    }

    // INTERCEPTOR 2: Check if we're on skills view and should show documents
    // Only intercept if:
    // 1. We're currently showing skills view
    // 2. The service has document requirements
    const documentRequirements = isServiceStep ? getServiceDocumentRequirements(currentStepData.serviceTitle!) : [];
    const hasDocuments = documentRequirements.length > 0;

    if (isServiceStep && isShowingSkills && !isShowingDocuments && hasDocuments) {
      // INTERCEPT: Navigate to documents view via URL
      router.push(`/dashboard/worker/services/setup?step=${stepSlug}&view=documents`);
      return;
    }

    // PROCEED: Either no skills/documents, or already showed them, or not a service step
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
        // Individual service step - save qualifications and skills
        // NOTE: documentsByService is saved directly during upload via uploadServiceDocument
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

      // Move to next step or go to Additional Documents (Section 3)
      if (currentStep < STEPS.length) {
        const nextStepSlug = STEPS[currentStep].slug;
        // Navigate to next service WITHOUT view parameter (will auto-determine)
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
  const handlePrevious = async () => {
    // If we're currently showing documents view, go back to skills view
    if (currentView.view === 'documents') {
      router.push(`/dashboard/worker/services/setup?step=${stepSlug}&view=skills`);
      return;
    }

    // If we're currently showing skills view
    if (currentView.view === 'skills') {
      // Check if service has qualifications
      const hasQualifications = currentStepData?.serviceTitle
        ? serviceHasQualifications(currentStepData.serviceTitle)
        : false;

      // If no qualifications, skip back to previous service instead of qualifications view
      if (!hasQualifications) {
        // Navigate to previous step
        if (currentStep > 1) {
          const prevStepSlug = STEPS[currentStep - 2].slug;
          router.push(`/dashboard/worker/services/setup?step=${prevStepSlug}`);
        }
        return;
      }

      // If has qualifications, go back to qualifications view
      router.push(`/dashboard/worker/services/setup?step=${stepSlug}&view=qualifications`);
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
    // Pass computed view from URL (100% deterministic, no flash!)
    currentView: currentView.view,
  };

  // Add service-specific props
  if (currentStepData.serviceTitle) {
    stepProps.serviceTitle = currentStepData.serviceTitle;
  }

  // Determine next button text
  const getNextButtonText = () => {
    const { serviceHasSkills } = require("@/config/serviceSkills");
    const { getServiceDocumentRequirements } = require("@/config/serviceDocumentRequirements");
    const isLastService = currentStep === STEPS.length;
    const currentServiceHasSkills = currentStepData?.serviceTitle && serviceHasSkills(currentStepData.serviceTitle);
    const documentRequirements = currentStepData?.serviceTitle ? getServiceDocumentRequirements(currentStepData.serviceTitle) : [];
    const currentServiceHasDocuments = documentRequirements.length > 0;

    // If showing documents view of last service, show "Complete"
    if (currentView.view === 'documents' && isLastService) {
      return "Complete";
    }

    // If showing documents view of any other service, show "Next"
    if (currentView.view === 'documents') {
      return "Next";
    }

    // If showing skills view of last service but it has documents, show "Next"
    if (currentView.view === 'skills' && isLastService && currentServiceHasDocuments) {
      return "Next";
    }

    // If showing skills view of last service with no documents, show "Complete"
    if (currentView.view === 'skills' && isLastService) {
      return "Complete";
    }

    // If showing skills view of any other service, show "Next"
    if (currentView.view === 'skills') {
      return "Next";
    }

    // If on qualifications of last service but it has skills or documents, show "Next"
    if (isLastService && (currentServiceHasSkills || currentServiceHasDocuments)) {
      return "Next";
    }

    // If on qualifications of last service with no skills and no documents, show "Complete"
    if (isLastService) {
      return "Complete";
    }

    // Otherwise show "Next"
    return "Next";
  };

  // Determine if we should show the Previous button
  const shouldShowPrevious = useMemo(() => {
    // Always show on documents view
    if (currentView.view === 'documents') {
      return true;
    }

    // On skills view, only show if service has qualifications
    if (currentView.view === 'skills') {
      const serviceTitle = currentStepData?.serviceTitle;
      if (serviceTitle) {
        return serviceHasQualifications(serviceTitle);
      }
    }

    // Don't show on qualifications view
    return false;
  }, [currentView.view, currentStepData?.serviceTitle]);

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
        nextButtonText={getNextButtonText()}
        showSkip={false}
        showPrevious={shouldShowPrevious}
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
