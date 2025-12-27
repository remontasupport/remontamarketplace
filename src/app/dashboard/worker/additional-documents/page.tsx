"use client";

/**
 * Additional Documents Page - Section 3
 * Route: /dashboard/worker/additional-documents
 *
 * Optional documents that enhance worker qualifications
 */

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StepContainer from "@/components/account-setup/shared/StepContainer";
import { useWorkerProfile, useUpdateProfileStep } from "@/hooks/queries/useWorkerProfile";
import Step2OtherDocuments from "@/components/services-setup/steps/Step2OtherDocuments";
import Loader from "@/components/ui/Loader";

function AdditionalDocumentsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Fetch profile data
  const { data: profileData, isLoading: isLoadingProfile } = useWorkerProfile(session?.user?.id);
  const updateProfileMutation = useUpdateProfileStep();

  // Form data state
  const [formData, setFormData] = useState({
    selectedQualifications: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Populate form data on load
  useEffect(() => {
    if (profileData) {
      setFormData({
        selectedQualifications: profileData.selectedQualifications || [],
      });
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

  // Save and complete
  const handleNext = async () => {
    if (!session?.user?.id) return;

    try {
      // Save to database (step 300 for Section 3)
      await updateProfileMutation.mutateAsync({
        userId: session.user.id,
        step: 300,
        data: {
          selectedQualifications: formData.selectedQualifications,
        },
      });

      // Redirect to dashboard
      setSuccessMessage("Additional documents saved!");
      setTimeout(() => {
        router.push("/dashboard/worker");
      }, 1500);
    } catch (error) {
      setErrors({ general: "Failed to save. Please try again." });
    }
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
        isNextLoading={updateProfileMutation.isPending}
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
