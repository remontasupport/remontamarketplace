"use client";

/**
 * Additional Documents Page - Section 3
 * Route: /dashboard/worker/additional-documents
 *
 * Optional documents that enhance worker qualifications: the insurance and transport documents of the worker's
 * services, all on apps/api (api-review U4e). Each document saves as it is uploaded; "Complete" only moves on (the
 * legacy "step 300" save it made had no case in the update-step route and wrote nothing).
 */

import { useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StepContainer from "@/components/account-setup/shared/StepContainer";
import { useWorkerProfile } from "@/features/worker/profile";
import Step2OtherDocuments from "@/components/services-setup/steps/Step2OtherDocuments";
import Loader from "@/components/ui/Loader";

function AdditionalDocumentsContent() {
  const { status } = useSession();
  const router = useRouter();

  // The api's profile read (the list on this page comes from it).
  const { isLoading: isLoadingProfile } = useWorkerProfile();

  // Form data state
  const [formData, setFormData] = useState({
    selectedQualifications: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const successMessage = "";

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

  // Complete: the documents are already saved; back to the dashboard.
  const handleNext = () => {
    router.push("/dashboard/worker");
  };

  // Go back to services
  const handlePrevious = () => {
    router.push("/dashboard/worker/services/manage");
  };

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

  return (
    <DashboardLayout showProfileCard={false}>
      <StepContainer
        currentStep={1}
        totalSteps={1}
        stepTitle="Additional Documents"
        sectionTitle="Additional Credentials"
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSkip={() => {}}
        isNextLoading={false}
        nextButtonText="Complete"
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

        {/* Render step component */}
        <Step2OtherDocuments
          data={formData}
          onChange={handleFieldChange}
          errors={errors}
        />
      </StepContainer>
    </DashboardLayout>
  );
}

// Wrap in Suspense
export default function AdditionalDocumentsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout showProfileCard={false}>
        <div className="form-page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    }>
      <AdditionalDocumentsContent />
    </Suspense>
  );
}
