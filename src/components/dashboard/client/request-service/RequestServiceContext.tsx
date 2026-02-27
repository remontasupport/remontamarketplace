"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

// ============================================================================
// TYPES
// ============================================================================

interface DaySchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface PreferredDays {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface WhenData {
  frequency: string;
  sessionsPerPeriod: number;
  hoursPerPeriod: number;
  startPreference: string;
  specificDate: string;
  scheduling: string;
  preferredDays: PreferredDays;
  additionalNotes: string;
}

interface PreferencesData {
  preferredGender: string;
  preferredQualities: string;
}

interface SupportDetailsData {
  jobTitle: string;
}

interface OtherServices {
  [categoryId: string]: {
    selected: boolean;
    text: string;
  };
}

interface LocationData {
  suburb: string;
  state: string;
  postalCode: string;
  fullAddress: string;
}

export interface FormData {
  // Step 1: What
  selectedCategories: string[];
  selectedSubcategories: string[];
  otherServices: OtherServices;
  whatAdditionalInfo: string;
  // For API: structured services data
  services: {
    [categoryId: string]: {
      categoryName: string;
      subCategories: { id: string; name: string }[];
    };
  };

  // Step 2: Where
  selectedLocation: string;
  locationData: LocationData;

  // Step 3: When
  whenData: WhenData;

  // Step 4: Support Details
  supportDetailsData: SupportDetailsData;

  // Step 5: Preferences
  preferencesData: PreferencesData;
}

// Step configuration
export interface StepConfig {
  id: string;
  label: string;
  section: string;
  parentId?: string;
}

export const STEPS: StepConfig[] = [
  { id: "what", label: "Services", section: "what" },
  { id: "where", label: "Location", section: "where" },
  { id: "when", label: "Schedule", section: "when" },
  { id: "support-details", label: "Support details", section: "support-details", parentId: "details" },
  { id: "preferences", label: "Worker preferences", section: "preferences", parentId: "details" },
  { id: "preview", label: "Review & Submit", section: "preview" },
];

export interface SelectedParticipantData {
  firstName: string;
  lastName: string;
}

interface RequestServiceContextType {
  // Form data
  formData: FormData;
  updateFormData: <K extends keyof FormData>(key: K, value: FormData[K]) => void;

  // Selected client
  selectedParticipantId: string | null;
  selectedParticipantName: string | null;
  selectParticipant: (id: string, data: SelectedParticipantData) => void;
  clearSelectedParticipant: () => void;

  // Navigation
  currentStep: number;
  currentSection: string;
  goToNext: () => void;
  goToPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isStepAccessible: (stepIndex: number) => boolean;
  completedSteps: number[];

  // Submission
  isSubmitting: boolean;
  submitError: string | null;
  submitRequest: () => Promise<boolean>;
  submitSuccess: boolean;
  submittedParticipantId: string | null;

  // Validation
  validateCurrentStep: () => boolean;
  getStepErrors: () => string[];
}

const defaultDaySchedule: DaySchedule = {
  enabled: false,
  startTime: "",
  endTime: "",
};

const initialFormData: FormData = {
  // Step 1: What
  selectedCategories: [],
  selectedSubcategories: [],
  otherServices: {},
  whatAdditionalInfo: "",
  services: {},

  // Step 2: Where
  selectedLocation: "",
  locationData: {
    suburb: "",
    state: "",
    postalCode: "",
    fullAddress: "",
  },

  // Step 3: When
  whenData: {
    frequency: "weekly",
    sessionsPerPeriod: 1,
    hoursPerPeriod: 2.5,
    startPreference: "",
    specificDate: "",
    scheduling: "",
    preferredDays: {
      monday: { ...defaultDaySchedule },
      tuesday: { ...defaultDaySchedule },
      wednesday: { ...defaultDaySchedule },
      thursday: { ...defaultDaySchedule },
      friday: { ...defaultDaySchedule },
      saturday: { ...defaultDaySchedule },
      sunday: { ...defaultDaySchedule },
    },
    additionalNotes: "",
  },

  // Step 4: Support Details
  supportDetailsData: {
    jobTitle: "",
  },

  // Step 5: Preferences
  preferencesData: {
    preferredGender: "",
    preferredQualities: "",
  },
};

const STORAGE_KEY = "service-request-draft";

// ============================================================================
// CONTEXT
// ============================================================================

const RequestServiceContext = createContext<RequestServiceContextType | null>(null);

export function useRequestService() {
  const context = useContext(RequestServiceContext);
  if (!context) {
    throw new Error("useRequestService must be used within RequestServiceProvider");
  }
  return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

interface RequestServiceProviderProps {
  children: ReactNode;
}

export function RequestServiceProvider({ children }: RequestServiceProviderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentSection = searchParams.get("section") || "what";

  const basePath = pathname.includes("supportcoordinators")
    ? "/dashboard/supportcoordinators/request-service"
    : "/dashboard/client/request-service";

  // Form state
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedParticipantId, setSubmittedParticipantId] = useState<string | null>(null);

  // Selected client
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [selectedParticipantName, setSelectedParticipantName] = useState<string | null>(null);

  // Get current step index
  const currentStep = STEPS.findIndex((step) => step.section === currentSection);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined" && !isInitialized) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormData(parsed.formData || initialFormData);
          setCompletedSteps(parsed.completedSteps || []);
          if (parsed.selectedParticipantId) {
            setSelectedParticipantId(parsed.selectedParticipantId);
            setSelectedParticipantName(parsed.selectedParticipantName || null);
          }
        } catch (e) {
          console.error("Failed to parse saved form data:", e);
        }
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Save to localStorage on change
  useEffect(() => {
    if (typeof window !== "undefined" && isInitialized) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ formData, completedSteps, selectedParticipantId, selectedParticipantName })
      );
    }
  }, [formData, completedSteps, selectedParticipantId, selectedParticipantName, isInitialized]);

  // Update form data
  const updateFormData = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Select a client
  const selectParticipant = useCallback((id: string, data: SelectedParticipantData) => {
    setSelectedParticipantId(id);
    setSelectedParticipantName(`${data.firstName} ${data.lastName}`.trim());
  }, []);

  const clearSelectedParticipant = useCallback(() => {
    setSelectedParticipantId(null);
    setSelectedParticipantName(null);
  }, []);

  // Validation for each step
  const validateStep = useCallback((stepIndex: number): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const step = STEPS[stepIndex];

    switch (step.section) {
      case "what":
        if (formData.selectedCategories.length === 0) {
          errors.push("Please select at least one service category");
        }
        break;

      case "where":
        if (!formData.locationData.suburb) {
          errors.push("Please enter a suburb");
        }
        if (!formData.locationData.state) {
          errors.push("Please select a state");
        }
        if (!formData.locationData.postalCode) {
          errors.push("Please enter a postal code");
        }
        break;

      case "when":
        if (formData.whenData.frequency === "one-time") {
          if (!formData.whenData.specificDate) {
            errors.push("Please select the date for the support session");
          }
          const startTime = formData.whenData.preferredDays.monday.startTime;
          const endTime = formData.whenData.preferredDays.monday.endTime;
          if (startTime && !endTime) {
            errors.push("Please enter an end time");
          } else if (!startTime && endTime) {
            errors.push("Please enter a start time");
          } else if (startTime && endTime && endTime <= startTime) {
            errors.push("End time must be after start time");
          }
        } else {
          if (!formData.whenData.startPreference) {
            errors.push("Please select when you'd like to start");
          }
        }
        break;

      case "support-details":
        if (!formData.supportDetailsData.jobTitle.trim()) {
          errors.push("Please enter a job title");
        }
        if (!formData.whatAdditionalInfo.trim()) {
          errors.push("Please provide additional information about the support needed");
        }
        break;

      case "preferences":
        // Optional step - no validation required
        break;

      case "preview":
        // No validation - just review
        break;
    }

    return { isValid: errors.length === 0, errors };
  }, [formData]);

  const validateCurrentStep = useCallback(() => {
    return validateStep(currentStep).isValid;
  }, [currentStep, validateStep]);

  const getStepErrors = useCallback(() => {
    return validateStep(currentStep).errors;
  }, [currentStep, validateStep]);

  // Check if step is accessible - always true for flexible navigation
  const isStepAccessible = useCallback((stepIndex: number) => {
    return true; // Allow free navigation between steps
  }, []);

  // Navigation
  const canGoNext = currentStep < STEPS.length - 1;
  const canGoPrevious = currentStep > 0;

  const goToNext = useCallback(() => {
    if (!canGoNext) return;

    // Mark current step as completed (visited)
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }

    const nextStep = STEPS[currentStep + 1];
    router.push(`${basePath}?section=${nextStep.section}`);
  }, [canGoNext, currentStep, completedSteps, router, basePath]);

  const goToPrevious = useCallback(() => {
    if (!canGoPrevious) return;

    const prevStep = STEPS[currentStep - 1];
    router.push(`${basePath}?section=${prevStep.section}`);
  }, [canGoPrevious, currentStep, router, basePath]);

  // Validate all steps and return first error with step index
  const validateAllSteps = useCallback((): { isValid: boolean; error: string | null; stepIndex: number | null } => {
    // Step 0: Services (what)
    if (formData.selectedCategories.length === 0) {
      return { isValid: false, error: "Please select at least one service", stepIndex: 0 };
    }

    // Step 1: Location (where)
    if (!formData.locationData.suburb || !formData.locationData.state || !formData.locationData.postalCode) {
      return { isValid: false, error: "Please select a location", stepIndex: 1 };
    }

    // Step 2: Schedule (when)
    if (formData.whenData.frequency === "one-time") {
      if (!formData.whenData.specificDate) {
        return { isValid: false, error: "Please select the date for the support session", stepIndex: 2 };
      }
      const startTime = formData.whenData.preferredDays.monday.startTime;
      const endTime = formData.whenData.preferredDays.monday.endTime;
      if (startTime && !endTime) {
        return { isValid: false, error: "Please enter an end time", stepIndex: 2 };
      } else if (!startTime && endTime) {
        return { isValid: false, error: "Please enter a start time", stepIndex: 2 };
      } else if (startTime && endTime && endTime <= startTime) {
        return { isValid: false, error: "End time must be after start time", stepIndex: 2 };
      }
    } else {
      if (!formData.whenData.startPreference) {
        return { isValid: false, error: "Please select when you'd like to start", stepIndex: 2 };
      }
    }

    // Step 3: Support details
    if (!formData.supportDetailsData.jobTitle.trim()) {
      return { isValid: false, error: "Please enter a job title", stepIndex: 3 };
    }
    if (!formData.whatAdditionalInfo.trim()) {
      return { isValid: false, error: "Please provide additional information about the support needed", stepIndex: 3 };
    }

    // Require a selected client
    if (!selectedParticipantId) {
      return { isValid: false, error: "Please select a client before submitting", stepIndex: 0 };
    }

    return { isValid: true, error: null, stepIndex: null };
  }, [formData, selectedParticipantId]);

  // Submit request
  const submitRequest = useCallback(async (): Promise<boolean> => {
    setIsSubmitting(true);
    setSubmitError(null);

    // Validate all steps before submission
    const validation = validateAllSteps();
    if (!validation.isValid && validation.error && validation.stepIndex !== null) {
      setSubmitError(validation.error);
      setIsSubmitting(false);
      // Navigate to the step with the error
      const errorStep = STEPS[validation.stepIndex];
      router.push(`${basePath}?section=${errorStep.section}`);
      return false;
    }

    try {
      // Hard guard — selectedParticipantId must be a non-empty string
      if (!selectedParticipantId) {
        setSubmitError("Please select a client before submitting");
        setIsSubmitting(false);
        return false;
      }

      // Build location string
      const locationParts = [
        formData.locationData.suburb,
        formData.locationData.state,
        formData.locationData.postalCode,
      ].filter(Boolean);
      const locationString = formData.locationData.fullAddress || locationParts.join(", ");

      // Build the API payload
      const payload = {
        // Send as string — never null (null serialises as JSON null which the API treats as absent)
        participantId: selectedParticipantId,
        // Services
        services: formData.services,
        // Details
        details: {
          title: formData.supportDetailsData.jobTitle,
          description: formData.whatAdditionalInfo || undefined,
          scheduleNotes: formData.whenData.additionalNotes || undefined,
          schedulingPrefs: {
            preferredDays: formData.whenData.scheduling === "preferred"
              ? Object.entries(formData.whenData.preferredDays)
                  .filter(([_, schedule]) => schedule.enabled)
                  .map(([day, schedule]) => ({
                    day: day.charAt(0).toUpperCase() + day.slice(1),
                    startTime: schedule.startTime || undefined,
                    endTime: schedule.endTime || undefined,
                  }))
              : undefined,
            frequency: formData.whenData.frequency as "one-time" | "weekly" | "fortnightly" | "monthly" | "ongoing",
            sessionsPerPeriod: formData.whenData.sessionsPerPeriod,
            hoursPerPeriod: formData.whenData.hoursPerPeriod,
            scheduling: formData.whenData.scheduling || undefined,
            startPreference: formData.whenData.startPreference || undefined,
            startDate: formData.whenData.startPreference === "specific-date" ? formData.whenData.specificDate : undefined,
          },
          preferredWorkerGender: formData.preferencesData.preferredGender || undefined,
          specialRequirements: formData.preferencesData.preferredQualities || undefined,
        },
        // Location as string
        location: locationString,
      };

      const response = await fetch("/api/client/service-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit request");
      }

      // Clear localStorage on success
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }

      // Show success modal with the submitted participant ID
      setSubmittedParticipantId(result.data?.participantId || null);
      setSubmitSuccess(true);

      return true;
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit request");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, selectedParticipantId, router, validateAllSteps, basePath]);

  const value: RequestServiceContextType = {
    formData,
    updateFormData,
    selectedParticipantId,
    selectedParticipantName,
    selectParticipant,
    clearSelectedParticipant,
    currentStep,
    currentSection,
    goToNext,
    goToPrevious,
    canGoNext,
    canGoPrevious,
    isStepAccessible,
    completedSteps,
    isSubmitting,
    submitError,
    submitRequest,
    submitSuccess,
    submittedParticipantId,
    validateCurrentStep,
    getStepErrors,
  };

  return (
    <RequestServiceContext.Provider value={value}>
      {children}
    </RequestServiceContext.Provider>
  );
}
