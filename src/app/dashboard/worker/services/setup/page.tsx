"use client";

/**
 * Worker Services Setup - Multi-Step Form with Dynamic Service Steps
 * Route: /dashboard/worker/services/setup?step=[slug]
 *
 * Flow: [Service 1] → [Service 2] → ... → Other Documents
 * Example: Support Worker → Cleaning Services → Other Documents
 */

import { useState, useEffect, useLayoutEffect, useMemo, useRef, Suspense } from "react";
import { flushSync } from "react-dom";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StepContainer from "@/components/account-setup/shared/StepContainer";
import { useWorkerProfile, useUpdateProfileStep } from "@/hooks/queries/useWorkerProfile";
import { generateServicesSetupSteps, SERVICES_SETUP_STEPS } from "@/config/servicesSetupSteps";
import { serviceHasQualifications } from "@/config/serviceQualificationRequirements";
import { serviceNameToSlug } from "@/utils/serviceSlugMapping";
import Loader from "@/components/ui/Loader";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useWorkerServices } from "@/hooks/queries/useServiceSubcategories";
import { saveNursingRegistration, getNursingRegistration, saveTherapeuticRegistration, getTherapeuticRegistration } from "@/services/worker/workerServices.service";

// Form data interface
interface FormData {
  // Individual service qualifications
  qualificationsByService: Record<string, string[]>;
  // Individual service offerings (what services they can provide)
  offeringsByService: Record<string, string[]>;
  // Documents by service and requirement type (URLs)
  documentsByService: Record<string, Record<string, string[]>>;
  // Nursing registration (for nursing services only)
  nursingRegistration?: {
    nursingType?: 'registered' | 'enrolled';
    hasExperience?: boolean;
    registrationNumber?: string;
    expiryDay?: string;
    expiryMonth?: string;
    expiryYear?: string;
  };
  // Therapeutic registration (for therapeutic supports only)
  therapeuticRegistration?: {
    registrationNumber?: string;
    expiryDay?: string;
    expiryMonth?: string;
    expiryYear?: string;
  };
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

  // Fetch worker's selected services with SUSPENSE MODE
  // This throws a promise until data loads, preventing component render
  // Guarantees workerServices is ALWAYS defined when component renders
  // Result: ZERO flicker during navigation between steps
  const { data: workerServices } = useWorkerServices({ suspense: true });

  // Track if we've initialized form data
  const hasInitializedFormData = useRef(false);

  // Track if we've already redirected for this step to prevent infinite loops
  const hasRedirectedForStep = useRef<string | null>(null);

  // Form data state (view tracking moved to URL params)
  const [formData, setFormData] = useState<FormData>({
    qualificationsByService: {},
    offeringsByService: {},
    documentsByService: {},
    nursingRegistration: undefined,
    therapeuticRegistration: undefined,
    selectedQualifications: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [isFinalSaving, setIsFinalSaving] = useState(false);

  // Generate dynamic steps based on selected services
  const STEPS = profileData?.services && profileData.services.length > 0
    ? generateServicesSetupSteps(profileData.services)
    : SERVICES_SETUP_STEPS;

  // Find current step by slug
  const currentStepIndex = STEPS.findIndex((s) => s.slug === stepSlug);
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;
  const currentStepData = STEPS[currentStep - 1];

  // URL-FIRST ARCHITECTURE: View state is ONLY determined by URL parameter
  // This eliminates flicker by making view computation 100% deterministic and synchronous
  // Auto-determination happens in redirect logic (useEffect below), not during render
  const currentView = useMemo(() => {
    const serviceTitle = currentStepData?.serviceTitle;
    if (!serviceTitle) {
      return { view: 'default' as const, serviceTitle: null };
    }

    // ONLY respect explicit view parameter from URL
    // No async data dependencies = no flicker
    if (viewParam === 'registration') {
      return { view: 'registration' as const, serviceTitle };
    }
    if (viewParam === 'offerings') {
      return { view: 'offerings' as const, serviceTitle };
    }
    if (viewParam === 'documents') {
      return { view: 'documents' as const, serviceTitle };
    }
    if (viewParam === 'qualifications') {
      return { view: 'qualifications' as const, serviceTitle };
    }

    // Deterministic fallback when no view param (will be redirected by useEffect below)
    // Use qualifications as default to match most common case
    return { view: 'qualifications' as const, serviceTitle };
  }, [viewParam, currentStepData?.serviceTitle]);

 

  // Populate form data ONLY on initial load
  useEffect(() => {
    if (profileData && !hasInitializedFormData.current) {
      setFormData({
        qualificationsByService: profileData.qualificationsByService || {},
        offeringsByService: {}, // No longer used - offerings are managed via TanStack Query
        documentsByService: profileData.documentsByService || {},
        nursingRegistration: profileData.nursingRegistration || undefined,
        therapeuticRegistration: undefined,
        selectedQualifications: [],
      });
      hasInitializedFormData.current = true;
    }
  }, [profileData]);

  // Load nursing registration data when entering registration view
  useEffect(() => {
    const loadNursingRegistration = async () => {
      if (currentView.view === 'registration' && session?.user?.id) {
       
        const result = await getNursingRegistration();

        if (result.success && result.data) {
        
          setFormData(prev => ({
            ...prev,
            nursingRegistration: result.data!,
          }));
        } else {
         
        }
      }
    };

    loadNursingRegistration();
  }, [currentView.view, session?.user?.id]);

  // Load therapeutic registration data when entering offerings view for therapeutic supports
  useEffect(() => {
    const loadTherapeuticRegistration = async () => {
      if (currentView.view === 'offerings' && currentView.serviceTitle === 'Therapeutic Supports' && session?.user?.id) {
       
        const result = await getTherapeuticRegistration();

        if (result.success && result.data) {
       
          setFormData(prev => ({
            ...prev,
            therapeuticRegistration: result.data!,
          }));
        } else {
         
        }
      }
    };

    loadTherapeuticRegistration();
  }, [currentView.view, currentView.serviceTitle, session?.user?.id]);

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
    // Clear registration number error when nursing registration changes
    if (field === 'nursingRegistration' && value?.registrationNumber && errors.registrationNumber) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.registrationNumber;
        return newErrors;
      });
    }
    // Clear qualifications error when qualificationsByService or documentsByService changes
    if ((field === 'qualificationsByService' || field === 'documentsByService') && errors.qualifications) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.qualifications;
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

    // VALIDATION: Check if we're on qualifications view and all selected qualifications have uploads
    const isShowingQualifications = currentView.view === 'qualifications';
    if (isShowingQualifications && currentStepData?.serviceTitle) {
      const selectedQuals = formData.qualificationsByService?.[currentStepData.serviceTitle] || [];

      if (selectedQuals.length > 0) {
        // Check uploaded qualification files - need to query the database
        const { getServiceDocuments } = await import("@/services/worker/serviceDocuments.service");
        const documentsResult = await getServiceDocuments();

        if (documentsResult.success && documentsResult.data) {
          // Filter documents for current service
          const serviceDocuments = documentsResult.data.filter(
            (doc: any) => doc.serviceTitle === currentStepData.serviceTitle
          );

          // Get qualification types that have uploaded files
          const uploadedQualTypes = new Set(
            serviceDocuments.map((doc: any) => doc.documentType)
          );

          // Check if any selected qualification is missing an upload
          const missingUploads = selectedQuals.filter(qualType => !uploadedQualTypes.has(qualType));

          if (missingUploads.length > 0) {
            setErrors({
              qualifications: "Please upload documents for all selected qualifications before proceeding."
            });
            return;
          } else {
            // Clear the error if validation passes
            setErrors((prev) => {
              const newErrors = { ...prev };
              delete newErrors.qualifications;
              return newErrors;
            });
          }
        }
      }
    }

    // Define service step variables early
    const isServiceStep = !!currentStepData?.serviceTitle;

    // INTERCEPTOR 0: Check if we're on registration view (nursing services only)
    // Navigate to qualifications view OR skip to offerings if no qualifications
    const isShowingRegistration = currentView.view === 'registration';
    if (isShowingRegistration) {
      // Validate registration number (front-end only)
      if (!formData.nursingRegistration?.registrationNumber || formData.nursingRegistration.registrationNumber.trim() === '') {
        setErrors({ registrationNumber: "Please enter your registration number before proceeding." });
        return;
      }

      // Save nursing registration data using server action
      if (session?.user?.id && formData.nursingRegistration) {
        try {
         
          const result = await saveNursingRegistration({
            nursingType: formData.nursingRegistration.nursingType || 'registered',
            hasExperience: formData.nursingRegistration.hasExperience || false,
            registrationNumber: formData.nursingRegistration.registrationNumber || '',
            expiryDay: formData.nursingRegistration.expiryDay || '',
            expiryMonth: formData.nursingRegistration.expiryMonth || '',
            expiryYear: formData.nursingRegistration.expiryYear || '',
          });

          if (!result.success) {
            setErrors({ general: result.error || "Failed to save nursing registration. Please try again." });
            return;
          }

        
        } catch (error) {
          
          setErrors({ general: "Failed to save nursing registration. Please try again." });
          return;
        }
      }

      // Check if service has qualifications
      const hasQualifications = currentStepData?.serviceTitle
        ? serviceHasQualifications(currentStepData.serviceTitle)
        : false;

      // Check if service has offerings (from worker's selected subcategories)
      const selectedSubcategories = workerServices?.find(
        (s) => s.categoryName.toLowerCase() === (currentStepData.serviceTitle?.toLowerCase() || '')
      )?.subcategories || [];
      const hasOfferings = selectedSubcategories.length > 0;

      // If no qualifications but has offerings, skip to offerings
      if (!hasQualifications && hasOfferings) {
        router.push(`/dashboard/worker/services/setup?step=${stepSlug}&view=offerings`);
        return;
      }

      // If has qualifications, go to qualifications view
      if (hasQualifications) {
        router.push(`/dashboard/worker/services/setup?step=${stepSlug}&view=qualifications`);
        return;
      }

      // If no qualifications and no offerings, check for documents
      const documentRequirements = isServiceStep ? getServiceDocumentRequirements(currentStepData.serviceTitle!) : [];
      const hasDocuments = documentRequirements.length > 0;

      if (hasDocuments) {
        router.push(`/dashboard/worker/services/setup?step=${stepSlug}&view=documents`);
        return;
      }

      // Fallback: go to qualifications view
      router.push(`/dashboard/worker/services/setup?step=${stepSlug}&view=qualifications`);
      return;
    }

    // INTERCEPTOR 1: Check if we're on a service step - always show offerings view
    // Only intercept if:
    // 1. We have a serviceTitle (it's a service step, not "Other Documents")
    // 2. We're NOT currently showing offerings view
    // 3. We're NOT currently showing documents view
    // Note: We removed the hasOfferings check so offerings view shows even when empty
    const isShowingOfferings = currentView.view === 'offerings';
    const isShowingDocuments = currentView.view === 'documents';
    // Check if worker has selected subcategories for this service
    const serviceSelectedSubcategories = isServiceStep && workerServices?.find(
      (s) => s.categoryName.toLowerCase() === (currentStepData.serviceTitle?.toLowerCase() || '')
    )?.subcategories || [];
    const hasOfferings = isServiceStep && serviceSelectedSubcategories.length > 0;

    if (isServiceStep && !isShowingOfferings && !isShowingDocuments) {
      // INTERCEPT: Navigate to offerings view via URL (even if no offerings)
      router.push(`/dashboard/worker/services/setup?step=${stepSlug}&view=offerings`);
      return;
    }

    // INTERCEPTOR 2: Removed - Always show offerings view even if empty
    // This allows users to see "Add more services here" message
    const documentRequirements = isServiceStep ? getServiceDocumentRequirements(currentStepData.serviceTitle!) : [];
    const hasDocuments = documentRequirements.length > 0;

    // Note: We no longer skip to documents when there are no offerings
    // The offerings view will display a "Add more services here" link instead

    // VALIDATION: Check if we're on offerings view for therapeutic support
    // Validate and save registration data before proceeding
    if (isServiceStep && isShowingOfferings) {
      const serviceSlug = currentStepData?.serviceTitle ? serviceNameToSlug(currentStepData.serviceTitle) : '';
      const isTherapeuticSupport = serviceSlug === 'therapeutic-supports';

      if (isTherapeuticSupport) {
        // Validate that all date fields are filled
        const { expiryDay, expiryMonth, expiryYear } = formData.therapeuticRegistration || {};

        if (!expiryDay || !expiryMonth || !expiryYear) {
          setErrors({ expiryDate: "Select a date (Day/Month/Year)" });
          return;
        }

        // Save therapeutic registration data using server action
        if (session?.user?.id && formData.therapeuticRegistration) {
          try {
           
            const result = await saveTherapeuticRegistration({
              registrationNumber: formData.therapeuticRegistration.registrationNumber || '',
              expiryDay: formData.therapeuticRegistration.expiryDay || '',
              expiryMonth: formData.therapeuticRegistration.expiryMonth || '',
              expiryYear: formData.therapeuticRegistration.expiryYear || '',
            });

            if (!result.success) {
              setErrors({ general: result.error || "Failed to save therapeutic registration. Please try again." });
              return;
            }

          
          } catch (error) {
            
            setErrors({ general: "Failed to save therapeutic registration. Please try again." });
            return;
          }
        }
      }
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

    // Check if this is the final step (after all interceptors, so we know we're saving)
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

      const apiStep = 100 + currentStep;
      let dataToSend: any = {};

      // Determine what data to send based on current step
      if (stepSlug === "other-documents") {
        dataToSend = {
          selectedQualifications: formData.selectedQualifications,
        };
      } else {
        // Individual service step - save qualifications and nursing registration
        // NOTE: offeringsByService is saved via mutations in real-time (no need to save here)
        // NOTE: documentsByService is saved directly during upload via uploadServiceDocument
        dataToSend = {
          qualificationsByService: formData.qualificationsByService,
          nursingRegistration: formData.nursingRegistration,
        };
      }

      // Save to database
      await updateProfileMutation.mutateAsync({
        userId: session.user.id,
        step: apiStep,
        data: dataToSend,
      });

      // Move to next step or go to Additional Documents (Section 3)
      if (!isFinalStep) {
        // Reset loading state before navigation
        setIsNavigating(false);

        // Navigate to next service WITHOUT view parameter (will auto-determine)
        const nextStepSlug = STEPS[currentStep].slug;
        router.push(`/dashboard/worker/services/setup?step=${nextStepSlug}`);
      } else {
        // All services completed - Navigate to Additional Documents
        // (don't reset loading state - we're leaving anyway)
        router.push("/dashboard/worker/additional-documents");
      }
    } catch (error) {
      setIsNavigating(false);
      setIsFinalSaving(false);
      setErrors({ general: "Failed to save. Please try again." });
    }
  };

  // Go to previous step
  const handlePrevious = async () => {
    // If we're currently showing documents view
    if (currentView.view === 'documents') {
      // Check if worker has selected subcategories for this service
      const selectedSubcategories = currentStepData?.serviceTitle && workerServices?.find(
        (s) => s.categoryName.toLowerCase() === (currentStepData.serviceTitle?.toLowerCase() || '')
      )?.subcategories || [];
      const hasOfferings = selectedSubcategories.length > 0;
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

      // Check if it's nursing service (has registration but no qualifications/offerings)
      const serviceSlug = currentStepData?.serviceTitle ? serviceNameToSlug(currentStepData.serviceTitle) : '';
      const isNursingService = serviceSlug === 'nursing-services';
      if (isNursingService) {
        // Go back to registration (skip qualifications since there are none)
        router.push(`/dashboard/worker/services/setup?step=${stepSlug}&view=registration`);
        return;
      }

      // If no offerings and no qualifications and not nursing, go to previous service
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

      // Check if it's nursing service
      const serviceSlug = currentStepData?.serviceTitle ? serviceNameToSlug(currentStepData.serviceTitle) : '';
      const isNursingService = serviceSlug === 'nursing-services';

      // If no qualifications
      if (!hasQualifications) {
        // If nursing service, go back to registration
        if (isNursingService) {
          router.push(`/dashboard/worker/services/setup?step=${stepSlug}&view=registration`);
          return;
        }

        // Otherwise, navigate to previous step
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

    // If we're currently showing qualifications view
    if (currentView.view === 'qualifications') {
      // Check if it's nursing service (has registration view before qualifications)
      const serviceSlug = currentStepData?.serviceTitle ? serviceNameToSlug(currentStepData.serviceTitle) : '';
      const isNursingService = serviceSlug === 'nursing-services';

      if (isNursingService) {
        // Go back to registration view
        router.push(`/dashboard/worker/services/setup?step=${stepSlug}&view=registration`);
        return;
      }
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

  // AUTO-REDIRECT: Set initial view parameter when missing
  // With Suspense mode, component won't render until workerServices exists
  // This effect redirects to correct initial view based on service configuration
  useEffect(() => {
    // Only redirect if:
    // 1. We have a valid step
    // 2. No view parameter in URL
    // 3. We have a service title (not "Other Documents")
    // 4. workerServices exists (guaranteed by Suspense, but checked for safety)
    // 5. Haven't already redirected for this step (prevents infinite loops)
    if (!stepSlug || viewParam || !currentStepData?.serviceTitle || !workerServices) {
      return;
    }

    // Check if we've already redirected for this step
    const redirectKey = `${stepSlug}-no-view`;
    if (hasRedirectedForStep.current === redirectKey) {
      return;
    }

    const serviceTitle = currentStepData.serviceTitle;
    const serviceSlug = serviceNameToSlug(serviceTitle);
    const isNursingService = serviceSlug === 'nursing-services';

    // Compute the correct initial view using the same logic as before
    // But now it runs asynchronously, not during render
    const hasQualifications = serviceHasQualifications(serviceTitle);

    const selectedSubcategories = workerServices.find(
      (s) => s.categoryName.toLowerCase() === serviceTitle.toLowerCase()
    )?.subcategories || [];
    const hasOfferings = selectedSubcategories.length > 0;

    const { getServiceDocumentRequirements } = require("@/config/serviceDocumentRequirements");
    const documentRequirements = getServiceDocumentRequirements(serviceTitle);
    const hasDocuments = documentRequirements.length > 0;

    // Determine initial view based on service configuration
    let initialView = 'qualifications'; // default

    if (isNursingService) {
      initialView = 'registration';
    } else if (!hasQualifications) {
      // Always show offerings view if no qualifications (even if empty)
      initialView = 'offerings';
    } else if (hasQualifications) {
      initialView = 'qualifications';
    }

    // Mark that we've redirected for this step
    hasRedirectedForStep.current = redirectKey;

    // Redirect to same step with explicit view parameter
    // Use replace() instead of push() to avoid polluting browser history
    router.replace(`/dashboard/worker/services/setup?step=${stepSlug}&view=${initialView}`);
  }, [stepSlug, viewParam, currentStepData?.serviceTitle, workerServices, router]);

  // Reset redirect tracking when step changes
  useEffect(() => {
    if (viewParam) {
      // If we have a view param, we can reset the redirect tracking
      // This allows the effect to run again when navigating to a new step
      hasRedirectedForStep.current = null;
    }
  }, [stepSlug, viewParam]);

  // Determine if we should show the Previous button
  const shouldShowPrevious = useMemo(() => {
    // Always show on documents view
    if (currentView.view === 'documents') {
      return true;
    }

    // On offerings view, show Previous button if:
    // - Service has qualifications (to go back to qualifications), OR
    // - Service is nursing (to go back to registration), OR
    // - It's the first step (can't go back to previous service)
    if (currentView.view === 'offerings') {
      const serviceTitle = currentStepData?.serviceTitle;
      if (serviceTitle) {
        const hasQualifications = serviceHasQualifications(serviceTitle);
        const serviceSlug = serviceNameToSlug(serviceTitle);
        const isNursingService = serviceSlug === 'nursing-services';
        // Show if has qualifications or is nursing service
        return hasQualifications || isNursingService;
      }
    }

    // On qualifications view, show if it's nursing service (to go back to registration)
    if (currentView.view === 'qualifications') {
      const serviceTitle = currentStepData?.serviceTitle;
      if (serviceTitle) {
        const serviceSlug = serviceNameToSlug(serviceTitle);
        const isNursingService = serviceSlug === 'nursing-services';
        return isNursingService;
      }
    }

    // Don't show on registration view (it's the first view for nursing services)
    return false;
  }, [currentView.view, currentStepData?.serviceTitle]);

  // CRITICAL: ALL HOOKS MUST BE CALLED ABOVE THIS LINE
  // Loading checks happen here to prevent Hook order violations

  // Loading state check (Suspense handles workerServices loading)
  if (status === "loading" || isLoadingProfile) {
    return (
      <DashboardLayout showProfileCard={false}>
        <div className="form-page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  // FLICKER PREVENTION: Show loading state when we're about to auto-redirect
  // This prevents rendering the wrong view before the redirect completes
  const isAboutToRedirect = !viewParam && currentStepData?.serviceTitle && workerServices;
  if (isAboutToRedirect) {
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
    // Check if worker has selected subcategories for this service
    const selectedSubcategories = currentStepData?.serviceTitle && workerServices?.find(
      (s) => s.categoryName.toLowerCase() === (currentStepData.serviceTitle?.toLowerCase() || '')
    )?.subcategories || [];
    const currentServiceHasOfferings = selectedSubcategories.length > 0;
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

  return (
    <DashboardLayout showProfileCard={false}>
      {!isFinalSaving ? (
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
      ) : (
        <LoadingOverlay isOpen={isFinalSaving} message="Completing your services setup..." />
      )}
    </DashboardLayout>
  );
}

// SUSPENSE BOUNDARY: Prevents flicker by suspending render until data is ready
// useWorkerServices hook throws a promise when loading (suspense: true)
// Component won't render until workerServices data is available
// This guarantees zero UI flicker during navigation
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
