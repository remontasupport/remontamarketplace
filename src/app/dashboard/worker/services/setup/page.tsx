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
import Loader from "@/components/ui/Loader";
import { useSubcategories, getCategoryIdFromName } from "@/hooks/queries/useServiceSubcategories";

// Form data interface
interface FormData {
  // Individual service qualifications
  qualificationsByService: Record<string, string[]>;
  // Individual service offerings (what services they can provide)
  offeringsByService: Record<string, string[]>;
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
    offeringsByService: {},
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

  // Fetch subcategories for the current service to check if offerings exist
  // Must be called after currentStepData is defined, but hooks must be called unconditionally
  const currentServiceCategoryId = currentStepData?.serviceTitle
    ? getCategoryIdFromName(currentStepData.serviceTitle)
    : undefined;
  const { data: availableSubcategories } = useSubcategories(currentServiceCategoryId);

  // Compute current view PURELY from URL + service configuration (100% deterministic!)
  const currentView = useMemo(() => {
    const serviceTitle = currentStepData?.serviceTitle;
    if (!serviceTitle) {
      return { view: 'default' as const, serviceTitle: null };
    }

    // Priority 1: Use explicit view from URL if present
    if (viewParam === 'offerings') {
      return { view: 'offerings' as const, serviceTitle };
    }
    if (viewParam === 'documents') {
      return { view: 'documents' as const, serviceTitle };
    }
    if (viewParam === 'qualifications') {
      return { view: 'qualifications' as const, serviceTitle };
    }

    // Priority 2: Auto-determine initial view based on service configuration
    const hasQualifications = serviceHasQualifications(serviceTitle);
    // Check database for subcategories instead of hardcoded config
    const hasOfferings = availableSubcategories && availableSubcategories.length > 0;
    const { getServiceDocumentRequirements } = require("@/config/serviceDocumentRequirements");
    const documentRequirements = getServiceDocumentRequirements(serviceTitle);
    const hasDocuments = documentRequirements.length > 0;

    // Auto-show documents if no qualifications and no offerings but has documents
    if (!hasQualifications && !hasOfferings && hasDocuments) {
      return { view: 'documents' as const, serviceTitle };
    }

    // Auto-show offerings if no qualifications but has offerings
    if (!hasQualifications && hasOfferings) {
      return { view: 'offerings' as const, serviceTitle };
    }

    // Default: qualifications view (if service has qualifications)
    if (hasQualifications) {
      return { view: 'qualifications' as const, serviceTitle };
    }

    // Fallback: if no qualifications, no offerings, no documents - show default
    return { view: 'default' as const, serviceTitle };
  }, [stepSlug, viewParam, currentStepData?.serviceTitle, availableSubcategories]);

  console.log('[ServicesSetup] Computed currentView (URL-based):', {
    stepSlug,
    viewParam,
    serviceTitle: currentStepData?.serviceTitle,
    currentView,
    availableSubcategoriesCount: availableSubcategories?.length || 0,
    hasOfferings: availableSubcategories && availableSubcategories.length > 0,
  });

  // Populate form data ONLY on initial load
  useEffect(() => {
    if (profileData && !hasInitializedFormData.current) {
      setFormData({
        qualificationsByService: profileData.qualificationsByService || {},
        offeringsByService: {}, // No longer used - offerings are managed via TanStack Query
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
    // Import getServiceDocumentRequirements
    const { getServiceDocumentRequirements } = await import("@/config/serviceDocumentRequirements");

    // INTERCEPTOR 1: Check if we're on a service step with offerings
    // Only intercept if:
    // 1. We have a serviceTitle (it's a service step, not "Other Documents")
    // 2. We're NOT currently showing offerings view
    // 3. We're NOT currently showing documents view
    // 4. The service has offerings (from database)
    const isServiceStep = !!currentStepData?.serviceTitle;
    const isShowingOfferings = currentView.view === 'offerings';
    const isShowingDocuments = currentView.view === 'documents';
    // Check database for subcategories instead of hardcoded config
    const hasOfferings = isServiceStep && availableSubcategories && availableSubcategories.length > 0;

    if (isServiceStep && !isShowingOfferings && !isShowingDocuments && hasOfferings) {
      // INTERCEPT: Navigate to offerings view via URL
      router.push(`/dashboard/worker/services/setup?step=${stepSlug}&view=offerings`);
      return;
    }

    // INTERCEPTOR 2: Check if we're on qualifications view and should skip to documents
    // Only intercept if:
    // 1. We're on qualifications view (not showing offerings or documents)
    // 2. The service does NOT have offerings
    // 3. The service DOES have document requirements
    const documentRequirements = isServiceStep ? getServiceDocumentRequirements(currentStepData.serviceTitle!) : [];
    const hasDocuments = documentRequirements.length > 0;

    if (isServiceStep && !isShowingOfferings && !isShowingDocuments && !hasOfferings && hasDocuments) {
      // INTERCEPT: Navigate directly to documents view (skip offerings)
      router.push(`/dashboard/worker/services/setup?step=${stepSlug}&view=documents`);
      return;
    }

    // INTERCEPTOR 3: Check if we're on offerings view and should show documents
    // Only intercept if:
    // 1. We're currently showing offerings view
    // 2. The service has document requirements
    if (isServiceStep && isShowingOfferings && !isShowingDocuments && hasDocuments) {
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
        // Individual service step - save qualifications
        // NOTE: offeringsByService is saved via mutations in real-time (no need to save here)
        // NOTE: documentsByService is saved directly during upload via uploadServiceDocument
        dataToSend = {
          qualificationsByService: formData.qualificationsByService,
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
    // If we're currently showing documents view
    if (currentView.view === 'documents') {
      // Check database for subcategories instead of hardcoded config
      const hasOfferings = availableSubcategories && availableSubcategories.length > 0;
      const hasQualifications = currentStepData?.serviceTitle
        ? serviceHasQualifications(currentStepData.serviceTitle)
        : false;

      // If service has offerings, go back to offerings view
      if (hasOfferings) {
        router.push(`/dashboard/worker/services/setup?step=${stepSlug}&view=offerings`);
        return;
      }

      // If service has qualifications (but no offerings), go back to qualifications view
      if (hasQualifications) {
        router.push(`/dashboard/worker/services/setup?step=${stepSlug}&view=qualifications`);
        return;
      }

      // If no offerings and no qualifications, go to previous service
      if (currentStep > 1) {
        const prevStepSlug = STEPS[currentStep - 2].slug;
        router.push(`/dashboard/worker/services/setup?step=${prevStepSlug}`);
      }
      return;
    }

    // If we're currently showing offerings view
    if (currentView.view === 'offerings') {
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
    const { getServiceDocumentRequirements } = require("@/config/serviceDocumentRequirements");
    const isLastService = currentStep === STEPS.length;
    // Check database for subcategories instead of hardcoded config
    const currentServiceHasOfferings = availableSubcategories && availableSubcategories.length > 0;
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

    // If showing offerings view of last service but it has documents, show "Next"
    if (currentView.view === 'offerings' && isLastService && currentServiceHasDocuments) {
      return "Next";
    }

    // If showing offerings view of last service with no documents, show "Complete"
    if (currentView.view === 'offerings' && isLastService) {
      return "Complete";
    }

    // If showing offerings view of any other service, show "Next"
    if (currentView.view === 'offerings') {
      return "Next";
    }

    // If on qualifications of last service but it has offerings or documents, show "Next"
    if (isLastService && (currentServiceHasOfferings || currentServiceHasDocuments)) {
      return "Next";
    }

    // If on qualifications of last service with no offerings and no documents, show "Complete"
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

    // On offerings view, only show if service has qualifications
    if (currentView.view === 'offerings') {
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
