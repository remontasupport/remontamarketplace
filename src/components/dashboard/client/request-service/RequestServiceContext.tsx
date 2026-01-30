"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  sessionsPerWeek: number;
  hoursPerWeek: number;
  startPreference: string;
  specificDate: string;
  scheduling: string;
  preferredDays: PreferredDays;
  additionalNotes: string;
}

interface DetailsData {
  firstName: string;
  lastName: string;
  gender: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
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

  // Step 5: Details (Basic Information)
  detailsData: DetailsData;

  // Step 6: Diagnoses
  selectedConditions: string[];

  // Step 7: Preferences
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
  { id: "what", label: "What", section: "what" },
  { id: "where", label: "Where", section: "where" },
  { id: "when", label: "When", section: "when" },
  { id: "support-details", label: "Support details", section: "support-details", parentId: "details" },
  { id: "details", label: "Basic information", section: "details", parentId: "details" },
  { id: "diagnoses", label: "Diagnoses", section: "diagnoses", parentId: "details" },
  { id: "preferences", label: "Preferences", section: "preferences", parentId: "details" },
  { id: "preview", label: "Preview", section: "preview" },
];

interface RequestServiceContextType {
  // Form data
  formData: FormData;
  updateFormData: <K extends keyof FormData>(key: K, value: FormData[K]) => void;

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
    sessionsPerWeek: 1,
    hoursPerWeek: 2.5,
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

  // Step 5: Details
  detailsData: {
    firstName: "",
    lastName: "",
    gender: "",
    dobDay: "",
    dobMonth: "",
    dobYear: "",
  },

  // Step 6: Diagnoses
  selectedConditions: [],

  // Step 7: Preferences
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
  const currentSection = searchParams.get("section") || "what";

  // Form state
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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
        JSON.stringify({ formData, completedSteps })
      );
    }
  }, [formData, completedSteps, isInitialized]);

  // Update form data
  const updateFormData = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
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
        if (!formData.whenData.startPreference) {
          errors.push("Please select when you'd like to start");
        }
        break;

      case "support-details":
        if (!formData.supportDetailsData.jobTitle.trim()) {
          errors.push("Please enter a job title");
        }
        break;

      case "details":
        if (!formData.detailsData.firstName.trim()) {
          errors.push("Please enter the participant's first name");
        }
        if (!formData.detailsData.lastName.trim()) {
          errors.push("Please enter the participant's last name");
        }
        if (!formData.detailsData.gender) {
          errors.push("Please select a gender");
        }
        break;

      case "diagnoses":
        // Optional step - no validation required
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
    router.push(`/dashboard/client/request-service?section=${nextStep.section}`);
  }, [canGoNext, currentStep, completedSteps, router]);

  const goToPrevious = useCallback(() => {
    if (!canGoPrevious) return;

    const prevStep = STEPS[currentStep - 1];
    router.push(`/dashboard/client/request-service?section=${prevStep.section}`);
  }, [canGoPrevious, currentStep, router]);

  // Submit request
  const submitRequest = useCallback(async (): Promise<boolean> => {
    setIsSubmitting(true);
    setSubmitError(null);

    console.log('=== SUBMIT REQUEST DEBUG ===');
    console.log('Current formData:', JSON.stringify(formData, null, 2));

    try {
      // Build the API payload
      const payload = {
        participant: {
          firstName: formData.detailsData.firstName,
          lastName: formData.detailsData.lastName,
          dateOfBirth: formData.detailsData.dobYear && formData.detailsData.dobMonth && formData.detailsData.dobDay
            ? `${formData.detailsData.dobYear}-${formData.detailsData.dobMonth.padStart(2, "0")}-${formData.detailsData.dobDay.padStart(2, "0")}`
            : undefined,
          fundingType: "NDIS" as const, // Default, can be made dynamic
        },
        services: formData.services,
        details: {
          title: formData.supportDetailsData.jobTitle,
          description: formData.whenData.additionalNotes || undefined,
          schedulingPrefs: {
            preferredDays: Object.entries(formData.whenData.preferredDays)
              .filter(([_, schedule]) => schedule.enabled)
              .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1)),
            frequency: formData.whenData.frequency as "one-time" | "weekly" | "fortnightly" | "monthly" | "ongoing",
            startDate: formData.whenData.specificDate || undefined,
          },
          specialRequirements: formData.preferencesData.preferredQualities || undefined,
        },
        location: {
          suburb: formData.locationData.suburb,
          state: formData.locationData.state,
          postalCode: formData.locationData.postalCode,
          fullAddress: formData.locationData.fullAddress || undefined,
        },
      };

      console.log('Built payload:', JSON.stringify(payload, null, 2));

      const response = await fetch("/api/client/service-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      console.log('API Response status:', response.status);
      console.log('API Response body:', JSON.stringify(result, null, 2));

      if (!response.ok) {
        console.log('Request failed:', result);
        throw new Error(result.error || "Failed to submit request");
      }

      // Clear localStorage on success
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }

      // Reset form state
      setFormData(initialFormData);
      setCompletedSteps([]);

      // Redirect to success page or requests list
      router.push("/dashboard/client?tab=requests&success=true");

      return true;
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit request");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, router]);

  const value: RequestServiceContextType = {
    formData,
    updateFormData,
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
    validateCurrentStep,
    getStepErrors,
  };

  return (
    <RequestServiceContext.Provider value={value}>
      {children}
    </RequestServiceContext.Provider>
  );
}
