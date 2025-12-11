"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Step1Location } from "../../../components/forms/workerRegistration/Step1Location";
import { Step1PersonalInfo } from "../../../components/forms/workerRegistration/Step1PersonalInfo";
import { Step2AdditionalDetails } from "../../../components/forms/workerRegistration/Step2AdditionalDetails";
import { Step3Services } from "../../../components/forms/workerRegistration/Step3Services";
import { Step4Professional } from "../../../components/forms/workerRegistration/Step4Professional";
import { Step5Services } from "../../../components/forms/workerRegistration/Step5Services";
import { Step6PersonalTouch } from "../../../components/forms/workerRegistration/Step6PersonalTouch";
import { Step7Photos } from "../../../components/forms/workerRegistration/Step7Photos";
import { contractorFormSchema, type ContractorFormData, contractorFormDefaults } from "@/schema/contractorFormSchema";
import { SERVICE_OPTIONS, TOTAL_STEPS } from "@/constants";
import { getStepValidationFields } from "@/utils/registrationUtils";
import { formatWorkerDataForDatabase } from "@/utils/formatWorkerData";
import { useCategories, transformCategoriesToServiceOptions } from "@/hooks/queries/useCategories";
import { fetchWithRetry } from "@/utils/apiRetry";


export default function ContractorOnboarding() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [photoUploadError, setPhotoUploadError] = useState<string>("");
  const [forceUpdate, setForceUpdate] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [emailExistsError, setEmailExistsError] = useState<string>("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadedPhotoName, setUploadedPhotoName] = useState<string>("");
  const [registrationJobId, setRegistrationJobId] = useState<string | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'processing' | 'completed'>('idle');

  // Fetch categories from database with caching
  const { data: categories, isLoading: categoriesLoading, isError: categoriesError } = useCategories();

  // Transform categories to service options format (memoized to prevent re-renders)
  const serviceOptions = useMemo(() => {
    if (!categories) return SERVICE_OPTIONS; // Fallback to hardcoded while loading

    const transformed = transformCategoriesToServiceOptions(categories);

    // Sort to put priority categories at the top
    const priorityOrder = ['support-worker', 'support-worker-high-intensity', 'therapeutic-supports'];

    return transformed.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.id);
      const bIndex = priorityOrder.indexOf(b.id);

      // If both are priority, maintain their priority order
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      // If only a is priority, put it first
      if (aIndex !== -1) return -1;
      // If only b is priority, put it first
      if (bIndex !== -1) return 1;
      // Otherwise, maintain original order
      return 0;
    });
  }, [categories]);

  const { register, control, handleSubmit, formState, trigger, getValues, setValue, watch, setFocus, setError, clearErrors } = useForm<ContractorFormData>({
    resolver: zodResolver(contractorFormSchema),
    mode: "all", // Validate on all events - ensures errors show from trigger()
    reValidateMode: "onChange",
    criteriaMode: "all",
    shouldFocusError: true,
    defaultValues: contractorFormDefaults,
  });

  // Access errors directly from formState (not destructured) to ensure reactivity
  const errors = formState.errors;

  const progress = (currentStep / TOTAL_STEPS) * 100;

  // Optimized: Only watch fields for the current step to reduce re-renders
  const watchedServices = currentStep === 4 ? watch("services") : getValues("services");
  const watchedSupportWorkerCategories = currentStep === 4 ? watch("supportWorkerCategories") : getValues("supportWorkerCategories");
  const watchedPhotos = currentStep === 8 ? watch("photos") : getValues("photos");
  const watchedConsentProfileShare = currentStep === 8 ? watch("consentProfileShare") : getValues("consentProfileShare");
  const watchedConsentMarketing = currentStep === 8 ? watch("consentMarketing") : getValues("consentMarketing");
  const watchedHasVehicle = currentStep === 6 ? watch("hasVehicle") : getValues("hasVehicle");

  const validateCurrentStep = async (step: number) => {
    const fieldsToValidate = getStepValidationFields(step);

    // Trigger validation for the fields in this step
    const isValid = await trigger(fieldsToValidate, { shouldFocus: true });

    // Force a re-render to display errors
    setForceUpdate(prev => prev + 1);

    return isValid;
  };

  const handleServiceToggle = useCallback((service: string) => {
    const currentServices = getValues("services") || [];
    const updatedServices = currentServices.includes(service)
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    setValue("services", updatedServices, { shouldValidate: true });
  }, [setValue, getValues]);

  const handlePhotoUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Clear previous error
    setPhotoUploadError("");

    if (files.length === 0) return;

    // Only take the first file (single photo upload)
    const file = files[0];

    // Allowed image formats for profile photos (security-safe raster formats only)
    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    const isValidType = ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase());
    const isValidSize = file.size <= 10 * 1024 * 1024;

    if (!isValidType) {
      setPhotoUploadError(`${file.name} - Only JPG, PNG, and WebP images are allowed`);
      return;
    }

    if (!isValidSize) {
      setPhotoUploadError(`${file.name} - File exceeds 10MB limit`);
      return;
    }

    // Upload photo immediately to Blob storage
    setIsUploadingPhoto(true);
    setUploadedPhotoName(file.name);

    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('email', getValues('email') || '');

      const response = await fetch('/api/upload/worker-photo', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Store the Blob URL (not the file)
      setValue("photos", [result.url], { shouldValidate: true });

    } catch (error: any) {
      setPhotoUploadError(`Failed to upload photo: ${error.message}`);
      setValue("photos", [], { shouldValidate: true });
    } finally {
      setIsUploadingPhoto(false);
    }
  }, [setValue, getValues]);

  const removePhoto = useCallback(() => {
    setValue("photos", [], { shouldValidate: true });
    // Clear error when removing photo
    setPhotoUploadError("");
    setUploadedPhotoName("");
  }, [setValue]);

  const nextStep = async () => {
    if (currentStep < TOTAL_STEPS) {
      const isValid = await validateCurrentStep(currentStep);
      if (isValid) {
        // Step 2 is the personal info step with email field
        if (currentStep === 2) {
          // Clear previous email error
          setEmailExistsError("");

          // Check if email already exists in database
          const email = getValues("email");

          if (email) {
            try {
              // Use retry logic for email check (handles temporary failures)
              const response = await fetchWithRetry('/api/auth/check-email', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
              }, {
                maxRetries: 2, // Fewer retries for email check
                initialDelay: 500,
              });

              const result = await response.json();

              if (result.exists) {
                // Email already exists - show error and don't proceed
                setEmailExistsError("An account with this email already exists. Please use a different email or log in to your existing account.");

                // Scroll to the error message
                setTimeout(() => {
                  const errorElement = document.querySelector('.email-exists-error');
                  if (errorElement) {
                    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 100);

                return; // Don't proceed to next step
              }
            } catch (error) {
              // Continue anyway if the check fails (network error, etc.)
            }
          }
        }

        // Proceed to next step
        setCurrentStep(currentStep + 1);
      } else {
        // Validation failed - errors are now visible via trigger()
        // Scroll to first error after DOM updates
        setTimeout(() => {
          const firstErrorElement = document.querySelector('.text-red-500');
          if (firstErrorElement) {
            firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      // Clear email error when going back from step 3
      if (currentStep === 3) {
        setEmailExistsError("");
      }
      setCurrentStep(currentStep - 1);
    }
  };

  // Poll registration job status
  useEffect(() => {
    if (!registrationJobId || registrationStatus === 'completed') {
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/auth/registration-status/${registrationJobId}`);
        const result = await response.json();

        if (response.ok) {
          const status = result.status;

          if (status === 'completed') {
            setRegistrationStatus('completed');
            setIsLoading(false);
            // Redirect to success page after brief delay
            setTimeout(() => {
              window.location.href = `/registration/worker/success`;
            }, 500);
          } else if (status === 'failed') {
            setIsLoading(false);
            alert('Registration failed. Please try again or contact support.');
          }
          // Continue polling for other statuses (processing, retrying, etc.)
        }
      } catch (error) {
        // Continue polling on error
      }
    };

    // Poll every 2 seconds
    const intervalId = setInterval(checkStatus, 2000);

    // Initial check
    checkStatus();

    return () => clearInterval(intervalId);
  }, [registrationJobId, registrationStatus]);

  const onSubmit = async (data: ContractorFormData) => {
    try {
      setIsLoading(true);

      // Submit registration (processes immediately)
      const response = await fetchWithRetry('/api/auth/register-async', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }, {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 5000,
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle error
        alert(`Registration failed: ${result.error}`);
        setIsLoading(false);
        return;
      }

      // Registration successful - redirect to success page
      setRegistrationStatus('completed');
      window.location.href = `/registration/worker/success`;
    } catch (error: any) {
      // Show user-friendly error message
      const errorMessage = error?.message || "An error occurred during registration. Please try again.";
      alert(errorMessage);
      setIsLoading(false);
    }
  };


  if (showWelcome) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardContent className="p-12 text-center space-y-6">
              <div className="space-y-6">
                <h1 className="text-4xl text-gray-900 font-cooper">
                  Welcome to Remonta
                </h1>
                <div className="bg-[#EDEFF3] rounded-lg p-6 text-left max-w-lg mx-auto">
                  <p className="text-lg text-center text-[#0C1628] font-poppins font-medium mb-4">
                    There are thousands of people on Remonta looking for support workers just like you. Create your account today and tell us more about yourself
                  </p>
                
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => setShowWelcome(false)}
                  className="bg-[#0C1628] hover:bg-[#A3DEDE] text-white px-8 py-3 text-lg font-poppins font-medium rounded-lg transition-colors duration-200 border-0"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const onError = (errors: any) => {
    // Errors are already displayed inline in the form
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <Card>
          <CardHeader className="px-6 sm:px-8 lg:px-12">
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-6 sm:px-8 lg:px-12 py-8 pb-12">
            {/* Conditional rendering - only renders the active step */}
            {currentStep === 1 && (
              <Step1Location control={control} errors={errors} />
            )}

            {currentStep === 2 && (
              <>
                <Step1PersonalInfo
                  control={control}
                  errors={errors}
                />
                {emailExistsError && (
                  <div className="email-exists-error bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                    <p className="text-red-600 text-sm font-poppins">{emailExistsError}</p>
                  </div>
                )}
              </>
            )}

            {currentStep === 3 && (
              <Step2AdditionalDetails
                register={register}
                control={control}
                errors={errors}
                currentStep={currentStep}
              />
            )}

            {currentStep === 4 && (
              <>
                {categoriesLoading && (
                  <div className="text-center py-8">
                    <p className="text-gray-600 font-poppins">Loading service categories...</p>
                  </div>
                )}

                {categoriesError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 text-sm font-poppins">
                      Failed to load service categories. Please refresh the page or try again later.
                    </p>
                  </div>
                )}

                {!categoriesLoading && !categoriesError && (
                  <Step3Services
                    control={control}
                    errors={errors}
                    watchedServices={watchedServices}
                    supportWorkerCategories={watchedSupportWorkerCategories || []}
                    serviceOptions={serviceOptions}
                    categories={categories}
                    handleServiceToggle={handleServiceToggle}
                    setValue={setValue}
                  />
                )}
              </>
            )}

            {currentStep === 5 && (
              <Step4Professional
                register={register}
                control={control}
                errors={errors}
                currentStep={currentStep}
              />
            )}

            {currentStep === 6 && (
              <Step5Services
                register={register}
                errors={errors}
                watchedHasVehicle={watchedHasVehicle}
                setValue={setValue}
                trigger={trigger}
                currentStep={currentStep}
              />
            )}

            {currentStep === 7 && (
              <Step6PersonalTouch register={register} errors={errors} />
            )}

            {currentStep === 8 && (
              <Step7Photos
                errors={errors}
                watchedPhotos={watchedPhotos}
                watchedConsentProfileShare={watchedConsentProfileShare}
                watchedConsentMarketing={watchedConsentMarketing}
                handlePhotoUpload={handlePhotoUpload}
                removePhoto={removePhoto}
                setValue={setValue}
                trigger={trigger}
                photoUploadError={photoUploadError}
                isUploadingPhoto={isUploadingPhoto}
                uploadedPhotoName={uploadedPhotoName}
              />
            )}

            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1 || isLoading}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              {currentStep === TOTAL_STEPS ? (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading && registrationStatus !== 'completed' && "Submitting..."}
                  {registrationStatus === 'completed' && "✓ Registration complete!"}
                  {!isLoading && registrationStatus === 'idle' && "Complete Signup"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
