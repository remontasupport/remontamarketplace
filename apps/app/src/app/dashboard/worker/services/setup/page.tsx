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
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { manageServicesHref } from "@/features/worker/manageServicesLink";
import StepContainer from "@/components/account-setup/shared/StepContainer";
import { useWorkerProfile as useApiProfile } from "@/features/worker/profile";
import { formOf, messageOf, saveRegistration } from "@/features/worker/services";
import { workerApi } from "@/features/worker/api";
import { bodyOf, fieldValueOf, toolServiceOfTitle } from "@/features/worker/serviceTools";
import ServiceToolsStep, { type ToolsState } from "@/components/services-setup/steps/ServiceToolsStep";
import { generateServicesSetupSteps, SERVICES_SETUP_STEPS } from "@/config/servicesSetupSteps";
import { serviceHasQualifications } from "@/config/serviceQualificationRequirements";
import { getServiceDocumentRequirements } from "@/config/serviceDocumentRequirements";
import { serviceNameToSlug } from "@/utils/serviceSlugMapping";
import Loader from "@/components/ui/Loader";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useWorkerServices } from "@/hooks/queries/useServiceSubcategories";
import { useServiceDocuments } from "@/hooks/queries/useServiceDocuments";
import { startNavigationProgress } from "@/components/ui/NavigationProgress";
import { SERVICE_AREA_LINK } from "@/features/navigation/workerMenu";

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

  // The api's profile read (U3c; the only profile read of this page since api-review): the services, the
  // registrations and the documents.
  const { profile: apiProfile, isLoading: isLoadingProfile } = useApiProfile();
  const serviceNames = useMemo(() => apiProfile?.services.map((s) => s.categoryName) ?? [], [apiProfile]);

  // Fetch worker's selected services with SUSPENSE MODE
  // This throws a promise until data loads, preventing component render
  // Guarantees workerServices is ALWAYS defined when component renders
  // Result: ZERO flicker during navigation between steps
  const { data: workerServices } = useWorkerServices({ suspense: true });

  // Fetch service documents — used for qualifications upload validation (cached, no extra fetch)
  const { data: serviceDocumentsData } = useServiceDocuments();

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
  const STEPS = serviceNames.length > 0
    ? generateServicesSetupSteps(serviceNames)
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
    // worker-tools (UR-1): the "Your tools" screen, for the services that have a tool list only.
    if (viewParam === 'tools' && toolServiceOfTitle(serviceTitle)) {
      return { view: 'tools' as const, serviceTitle };
    }

    // Deterministic fallback when no view param (will be redirected by useEffect below)
    // Use qualifications as default to match most common case
    return { view: 'qualifications' as const, serviceTitle };
  }, [viewParam, currentStepData?.serviceTitle]);

  // worker-tools (UR-5, UR-6): the "Your tools" screen's value, read when the screen opens and saved by Next.
  const toolService = toolServiceOfTitle(currentStepData?.serviceTitle);
  const [tools, setTools] = useState<{ state: ToolsState; value: string[]; error?: string }>({ state: 'loading', value: [] });
  const [toolsAttempt, setToolsAttempt] = useState(0);
  useEffect(() => {
    if (currentView.view !== 'tools' || !toolService) return;
    const ctl = new AbortController();
    setTools({ state: 'loading', value: [] });
    workerApi
      .getServiceTools({ signal: ctl.signal })
      .then((r) => {
        if (ctl.signal.aborted) return;
        if (r.kind !== 'ok') return setTools({ state: 'failed', value: [] });
        const entry = r.body.services.find((x) => x.categoryId === toolService);
        setTools({ state: 'ready', value: entry ? fieldValueOf(entry) : [] });
      })
      .catch(() => {
        if (!ctl.signal.aborted) setTools({ state: 'failed', value: [] });
      });
    return () => ctl.abort();
  }, [currentView.view, toolService, toolsAttempt]);


  // Populate form data ONLY on initial load
  useEffect(() => {
    if (apiProfile && !hasInitializedFormData.current) {
      // The documents' URLs by service and type, from the api's service documents; the registrations are filled by
      // the effect below.
      const documentsByService: Record<string, Record<string, string[]>> = {};
      for (const d of apiProfile.serviceDocuments) {
        if (!d.url || !d.serviceName) continue;
        ((documentsByService[d.serviceName] ??= {})[d.requirementType] ??= []).push(d.url);
      }
      setFormData((prev) => ({
        ...prev,
        qualificationsByService: {},
        offeringsByService: {}, // No longer used - offerings are managed via TanStack Query
        documentsByService,
        selectedQualifications: [],
      }));
      hasInitializedFormData.current = true;
    }
  }, [apiProfile]);

  // The registrations come with the profile read (U3c): filled in once, when the profile arrives.
  const registrationsLoaded = useRef(false);
  useEffect(() => {
    if (!apiProfile || registrationsLoaded.current) return;
    registrationsLoaded.current = true;
    const nursing = formOf(apiProfile.serviceRegistrations.find((r) => r.categoryId === "nursing-services"));
    const therapeutic = formOf(apiProfile.serviceRegistrations.find((r) => r.categoryId === "therapeutic-supports"));
    setFormData((prev) => ({
      ...prev,
      ...(nursing ? { nursingRegistration: nursing } : {}),
      ...(therapeutic ? { therapeuticRegistration: { registrationNumber: therapeutic.registrationNumber, expiryDay: therapeutic.expiryDay, expiryMonth: therapeutic.expiryMonth, expiryYear: therapeutic.expiryYear } } : {}),
    }));
  }, [apiProfile]);

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
    const { view } = currentView;
    const serviceTitle = currentStepData?.serviceTitle ?? '';
    const isServiceStep = !!serviceTitle;

    // --- REGISTRATION VIEW (nursing) ---
    if (view === 'registration') {
      const isEnrolledNurse = formData.nursingRegistration?.nursingType === 'enrolled';
      if (!isEnrolledNurse && !formData.nursingRegistration?.registrationNumber?.trim()) {
        setErrors({ registrationNumber: "Please enter your registration number before proceeding." });
        return;
      }

      const hasQualifications = serviceHasQualifications(serviceTitle);
      const subcategories = workerServices?.find(
        s => s.categoryName.toLowerCase() === serviceTitle.toLowerCase()
      )?.subcategories ?? [];
      const documentRequirements = getServiceDocumentRequirements(serviceTitle);

      const nextView = hasQualifications ? 'qualifications'
        : subcategories.length > 0 ? 'offerings'
        : documentRequirements.length > 0 ? 'documents'
        : 'qualifications';

      // Saved before moving on (U3c): the api checks the number and the expiry, and its message is shown here.
      if (formData.nursingRegistration) {
        setIsNavigating(true);
        const saved = await saveRegistration("nursing-services", formData.nursingRegistration);
        setIsNavigating(false);
        if (!saved.ok) {
          setErrors(saved.errors);
          return;
        }
      }
      router.push(`/dashboard/worker/services/setup?step=${stepSlug}&view=${nextView}`);
      return;
    }

    // --- QUALIFICATIONS VIEW ---
    if (view === 'qualifications') {
      const selectedQuals = formData.qualificationsByService?.[serviceTitle] ?? [];

      if (selectedQuals.length > 0 && serviceDocumentsData !== undefined) {
        // Use already-cached service documents — no extra API call
        const serviceDocuments = serviceDocumentsData.documents.filter(
          (doc: any) => doc.serviceTitle === serviceTitle
        );
        const uploadedTypes = new Set(serviceDocuments.map((doc: any) => doc.documentType));
        const missingUploads = selectedQuals.filter(q => !uploadedTypes.has(q));

        if (missingUploads.length > 0) {
          setErrors({ qualifications: "Please upload documents for all selected qualifications before proceeding." });
          return;
        }
        setErrors(prev => { const e = { ...prev }; delete e.qualifications; return e; });
      }

      router.push(`/dashboard/worker/services/setup?step=${stepSlug}&view=offerings`);
      return;
    }

    // --- OFFERINGS VIEW ---
    if (view === 'offerings' && isServiceStep) {
      const serviceSlug = serviceNameToSlug(serviceTitle);
      const hasDocuments = getServiceDocumentRequirements(serviceTitle).length > 0;

      if (serviceSlug === 'therapeutic-supports') {
        const { expiryDay, expiryMonth, expiryYear } = formData.therapeuticRegistration ?? {};
        if (!expiryDay || !expiryMonth || !expiryYear) {
          setErrors({ expiryDate: "Select a date (Day/Month/Year)" });
          return;
        }

        // Saved before moving on (U3c), its message shown here.
        setIsNavigating(true);
        const saved = await saveRegistration("therapeutic-supports", formData.therapeuticRegistration ?? {});
        setIsNavigating(false);
        if (!saved.ok) {
          setErrors(saved.errors);
          return;
        }
        if (hasDocuments) {
          router.push(`/dashboard/worker/services/setup?step=${stepSlug}&view=documents`);
          return;
        }
        // No documents: on to the next step below.
      } else if (hasDocuments) {
        router.push(`/dashboard/worker/services/setup?step=${stepSlug}&view=documents`);
        return;
      }
    }

    // --- THE TOOLS SCREEN (worker-tools) ---
    // After the service's last screen comes "Your tools" (UR-1); its Next saves them before moving on (UR-5). When the
    // read failed nothing was shown, so there is nothing to save (UR-6).
    if (toolService && view !== 'tools') {
      router.push(`/dashboard/worker/services/setup?step=${stepSlug}&view=tools`);
      return;
    }
    if (view === 'tools' && toolService && tools.state === 'ready') {
      setIsNavigating(true);
      const saved = await workerApi.putServiceTools(toolService, bodyOf(toolService, tools.value));
      setIsNavigating(false);
      if (saved.kind !== 'ok') {
        setTools((t) => ({ ...t, error: messageOf(saved, "We couldn't save your tools right now. Please try again in a moment.") }));
        return;
      }
    }

    // --- SAVE AND NAVIGATE TO NEXT STEP ---
    if (!validateStep() || !session?.user?.id) return;

    const isFinalStep = currentStep === STEPS.length;

    try {
      if (isFinalStep) {
        flushSync(() => setIsFinalSaving(true));
      } else {
        setIsNavigating(true);
      }

      // Nothing to save here (S9): every answer of these pages is saved where it is given -- the registrations
      // above, each document as it uploads. The step save this replaced matched no case and stored nothing.
      if (isFinalStep) {
        // The last service is done: on to Service Area, whose Save goes to the dashboard (user, 2026-10-16; was
        // Additional Credentials).
        startNavigationProgress();
        router.push(SERVICE_AREA_LINK.href);
      } else {
        setIsNavigating(false);
        router.push(`/dashboard/worker/services/setup?step=${STEPS[currentStep].slug}`);
      }
    } catch {
      setIsNavigating(false);
      setIsFinalSaving(false);
      setErrors({ general: "Failed to save. Please try again." });
    }
  };

  // Go to previous step
  const handlePrevious = async () => {
    // worker-tools (UR-7): back from "Your tools" to the service's last screen.
    if (currentView.view === 'tools') {
      const hasDocuments = currentStepData?.serviceTitle ? getServiceDocumentRequirements(currentStepData.serviceTitle).length > 0 : false;
      router.push(`/dashboard/worker/services/setup?step=${stepSlug}&view=${hasDocuments ? 'documents' : 'offerings'}`);
      return;
    }
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

  // Redirect to first step if no step specified or invalid slug -- only once the profile has said which services
  // there are: before it answers STEPS is the empty default, and a page opened directly (a refresh, a link) was sent
  // to Edit Services every time (U3c, seen 2026-10-15).
  useEffect(() => {
    if (isLoadingProfile || !apiProfile) return;
    if (!stepSlug && STEPS.length > 0) {
      // No step specified - redirect to first step
      router.push(`/dashboard/worker/services/setup?step=${STEPS[0].slug}`);
    } else if (currentStepIndex < 0 && STEPS.length > 0) {
      // Invalid step - redirect to first step
      router.push(`/dashboard/worker/services/setup?step=${STEPS[0].slug}`);
    } else if (STEPS.length === 0) {
      // No services selected - redirect to Edit Services page
      router.push("/dashboard/worker/account?tab=services");
    }
  }, [currentStepIndex, router, stepSlug, STEPS, isLoadingProfile, apiProfile]);

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
    // Always show on documents view, and on the tools screen (worker-tools)
    if (currentView.view === 'documents' || currentView.view === 'tools') {
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
    const isLastService = currentStep === STEPS.length;
    const selectedSubcategories = currentStepData?.serviceTitle && workerServices?.find(
      (s) => s.categoryName.toLowerCase() === (currentStepData.serviceTitle?.toLowerCase() || '')
    )?.subcategories || [];
    const currentServiceHasOfferings = selectedSubcategories.length > 0;
    const documentRequirements = currentStepData?.serviceTitle ? getServiceDocumentRequirements(currentStepData.serviceTitle) : [];
    const currentServiceHasDocuments = documentRequirements.length > 0;

    // worker-tools (UR-7): "Your tools" is the service's last screen, so every screen before it says Next.
    if (toolService) {
      return currentView.view === 'tools' && isLastService ? "Complete" : "Next";
    }

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

          {/* Adding or removing services is in Account (user, 2026-10-16): from every service, a link there and back. */}
          <p className="mb-4 text-sm font-poppins">
            <Link href={manageServicesHref(`/dashboard/worker/services/setup?step=${stepSlug}`)} className="text-teal-600 hover:text-teal-700 underline font-medium">
              Modify your Service
            </Link>
          </p>

          {/* Render current step (worker-tools: the "Your tools" screen in place of the service's screens) */}
          {currentView.view === 'tools' && toolService ? (
            <ServiceToolsStep
              service={toolService}
              state={tools.state}
              value={tools.value}
              onChange={(value) => setTools((t) => ({ ...t, value, error: undefined }))}
              onRetry={() => setToolsAttempt((n) => n + 1)}
              error={tools.error}
            />
          ) : (
            <CurrentStepComponent {...stepProps} />
          )}
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
