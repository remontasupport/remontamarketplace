"use client";

/**
 * Worker Account Setup - Multi-Step Form
 * Single page with URL-based step navigation
 * Route: /dashboard/worker/account/setup?step=1-7
 *
 * REFACTORED to follow Best_Fetching_Practic.md:
 * ✅ Uses TanStack Query for smart caching
 * ✅ 5-minute staleTime, 30-minute cache
 * ✅ Cache invalidation on mutations
 * ✅ No redundant API calls
 * ✅ Background refetching for fresh data
 */

import { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StepContainer from "@/components/account-setup/shared/StepContainer";
import { useWorkerProfile, useUpdateProfileStep } from "@/hooks/queries/useWorkerProfile";
import { ACCOUNT_SETUP_STEPS } from "@/config/accountSetupSteps";
import Loader from "@/components/ui/Loader";

// Helper function to parse location string
// Format: "Street Address, City/Suburb, State PostalCode" or "City/Suburb, State PostalCode"
// Example 1: "123 street, Victoria River Downs, NT 852" → { streetAddress: "123 street", city: "Victoria River Downs", state: "NT", postalCode: "852" }
// Example 2: "Victoria River Downs, NT 852" → { streetAddress: "", city: "Victoria River Downs", state: "NT", postalCode: "852" }
function parseLocation(location: string): { streetAddress: string; city: string; state: string; postalCode: string } {
  if (!location) return { streetAddress: "", city: "", state: "", postalCode: "" };

  const parts = location.split(",").map(part => part.trim());

  // If 3+ parts: first is street address, second is city, third+ is state/postal
  if (parts.length >= 3) {
    const streetAddress = parts[0] || "";
    const city = parts[1] || "";
    const statePostal = parts[2].split(/\s+/);
    const state = statePostal[0] || "";
    const postalCode = statePostal[statePostal.length - 1] || "";

    return { streetAddress, city, state, postalCode };
  }

  // If 2 parts: no street address, first is city, second is state/postal
  if (parts.length === 2) {
    const city = parts[0] || "";
    const statePostal = parts[1].split(/\s+/);
    const state = statePostal[0] || "";
    const postalCode = statePostal[statePostal.length - 1] || "";

    return { streetAddress: "", city, state, postalCode };
  }

  // If 1 part: just city
  return { streetAddress: "", city: parts[0] || "", state: "", postalCode: "" };
}

// Use centralized step configuration
const STEPS = ACCOUNT_SETUP_STEPS;

// Form data interface
interface FormData {
  // Step 1: Name
  firstName: string;
  middleName: string;
  lastName: string;
  // Step 2: Photo
  photo: string | null;
  // Step 3: Bio
  bio: string;
  // Step 4: Address
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  // Step 5: Proof of Identity
  identityDocuments: Array<{
    id?: string;
    documentType: string;
    documentUrl: string;
    uploadedAt: string;
  }>;
  // Step 6: Personal Info
  age: string;
  gender: string;
  languages: string[];
  hasVehicle: string;
  // Step 7: ABN
  abn: string;
}

function AccountSetupContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepSlug = searchParams.get("step") || "name";

  // Find current step by slug
  const currentStepIndex = STEPS.findIndex((s) => s.slug === stepSlug);
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;
  const currentStepData = STEPS[currentStep - 1];

  // TanStack Query hooks - replaces manual fetching
  const { data: profileData, isLoading: isLoadingProfile } = useWorkerProfile(session?.user?.id);
  const updateProfileMutation = useUpdateProfileStep();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Track if we've initialized form data to prevent overwrites
  const hasInitializedFormData = useRef(false);

  // Form data state
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    middleName: "",
    lastName: "",
    photo: null,
    bio: "",
    streetAddress: "",
    city: "",
    state: "",
    postalCode: "",
    identityDocuments: [],
    age: "",
    gender: "",
    languages: [],
    hasVehicle: "",
    abn: "",
  });

  // Populate form data ONLY on initial load
  // Prevents form reset when TanStack Query refetches after mutations
  useEffect(() => {
    if (profileData && !hasInitializedFormData.current) {
      const photoUrl = Array.isArray(profileData.photos)
        ? profileData.photos[0]
        : (profileData.photos as any)?.[0] || null;

      // Parse location string to extract street address, city, state, and postal code
      const parsedLocation = parseLocation(profileData.location || "");

      setFormData({
        firstName: profileData.firstName || "",
        middleName: profileData.middleName || "",
        lastName: profileData.lastName || "",
        photo: photoUrl,
        bio: profileData.introduction || "",
        streetAddress: parsedLocation.streetAddress || "",
        city: parsedLocation.city || profileData.city || "",
        state: parsedLocation.state || profileData.state || "",
        postalCode: parsedLocation.postalCode || profileData.postalCode || "",
        identityDocuments: [],
        age: profileData.age ? String(profileData.age) : "",
        gender: profileData.gender ? profileData.gender.toLowerCase() : "",
        languages: Array.isArray(profileData.languages) ? profileData.languages : [],
        hasVehicle: profileData.hasVehicle || "",
        abn: "",
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

  // Handle immediate photo save to database (called during upload)
  const handlePhotoSave = async (photoUrl: string) => {
    if (!session?.user?.id) return;

    try {
      await updateProfileMutation.mutateAsync({
        userId: session.user.id,
        step: 2, // Photo step
        data: { photo: photoUrl },
      });
    } catch (error) {
      throw error; // Re-throw so PhotoUpload component can handle it
    }
  };

  // Validate current step
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (stepSlug) {
      case "name": // Name
        if (!formData.firstName.trim()) {
          newErrors.firstName = "First name is required";
        }
        if (!formData.lastName.trim()) {
          newErrors.lastName = "Last name is required";
        }
        break;
      case "abn": // ABN
        if (formData.abn && formData.abn.replace(/\s/g, "").length !== 11) {
          newErrors.abn = "ABN must be 11 digits";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save current step and move to next
  // Now uses TanStack Query mutation with automatic cache invalidation
  const handleNext = async () => {
    // Validate current step
    if (!validateStep()) {
      return;
    }

    if (!session?.user?.id) return;

    try {
      // Skip saving for step 2 (photo) since it handles its own upload
      if (currentStep !== 2) {
        // Only send relevant fields for each step to avoid overwriting other fields
        let dataToSend: any = {};

        switch (currentStep) {
          case 1: // Name
            dataToSend = {
              firstName: formData.firstName,
              middleName: formData.middleName,
              lastName: formData.lastName,
            };
            break;
          case 3: // Bio
            dataToSend = { bio: formData.bio };
            break;
          case 4: // Address
            dataToSend = {
              streetAddress: formData.streetAddress,
              city: formData.city,
              state: formData.state,
              postalCode: formData.postalCode,
            };
            break;
          case 5: // Personal Info (Other personal info step)
            dataToSend = {
              age: formData.age,
              gender: formData.gender,
              languages: formData.languages,
              hasVehicle: formData.hasVehicle,
            };
          
            break;
          default:
            // For any other step, send the entire formData (fallback)
            dataToSend = formData;
        }

        // Use mutation hook - automatically invalidates cache on success
    
        await updateProfileMutation.mutateAsync({
          userId: session.user.id,
          step: currentStep,
          data: dataToSend,
        });
       
      }

      // Move to next step or finish
      if (currentStep < STEPS.length) {
        const nextStepSlug = STEPS[currentStep].slug;
        router.push(`/dashboard/worker/account/setup?step=${nextStepSlug}`);
      } else {
        // Last step completed
        setSuccessMessage("Account setup completed!");
        setTimeout(() => {
          router.push("/dashboard/worker");
        }, 2000);
      }
    } catch (error) {
      setErrors({ general: "Failed to save. Please try again." });
    }
  };

  // Go to previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      const prevStepSlug = STEPS[currentStep - 2].slug;
      router.push(`/dashboard/worker/account/setup?step=${prevStepSlug}`);
    }
  };

  // Skip current step
  const handleSkip = () => {
    if (currentStep < STEPS.length) {
      const nextStepSlug = STEPS[currentStep].slug;
      router.push(`/dashboard/worker/account/setup?step=${nextStepSlug}`);
    }
  };

  // Redirect to first step if invalid slug
  useEffect(() => {
    if (currentStepIndex < 0) {
      router.push("/dashboard/worker/account/setup?step=name");
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
        sectionTitle="Account details"
        sectionNumber="1"
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
          onPhotoSave={currentStep === 2 ? handlePhotoSave : undefined}
          errors={errors}
        />
      </StepContainer>
    </DashboardLayout>
  );
}

// Wrap the component in Suspense to handle useSearchParams()
export default function AccountSetupPage() {
  return (
    <Suspense fallback={
      <DashboardLayout showProfileCard={false}>
        <div className="form-page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    }>
      <AccountSetupContent />
    </Suspense>
  );
}
