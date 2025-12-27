"use client";

/**
 * Edit Services Page
 * Route: /dashboard/worker/services/manage
 *
 * Allows workers to add/remove services
 */

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Step1ServicesOffer from "@/components/services-setup/steps/Step1ServicesOffer";
import { useWorkerProfile, useUpdateProfileStep } from "@/hooks/queries/useWorkerProfile";
import Loader from "@/components/ui/Loader";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function ManageServicesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Fetch profile data
  const { data: profileData, isLoading: isLoadingProfile } = useWorkerProfile(session?.user?.id);
  const updateProfileMutation = useUpdateProfileStep();

  // Track if we've initialized form data
  const hasInitializedFormData = useRef(false);

  // Form data state
  const [formData, setFormData] = useState({
    services: [] as string[],
    supportWorkerCategories: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form data on initial load
  useEffect(() => {
    if (profileData && !hasInitializedFormData.current) {
      setFormData({
        services: profileData.services || [],
        supportWorkerCategories: profileData.supportWorkerCategories || [],
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

  // Auto-save services to database
  const handleSaveServices = async (services: string[], supportWorkerCategories: string[]) => {
    if (!session?.user?.id) return;

    try {
      await updateProfileMutation.mutateAsync({
        userId: session.user.id,
        step: 101, // Services step
        data: {
          services,
          supportWorkerCategories,
        },
      });
    } catch (error) {
      throw error;
    }
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
      <div className="form-page-container">
        <div className="account-step-container">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-poppins transition-colors text-sm"
            style={{ marginLeft: '2rem' }}
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back
          </button>

          {/* Render Services Management Component */}
          <Step1ServicesOffer
            data={formData}
            onChange={handleFieldChange}
            onSaveServices={handleSaveServices}
            errors={errors}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
