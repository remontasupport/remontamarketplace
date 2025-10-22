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


export default function ContractorOnboarding() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [photoUploadError, setPhotoUploadError] = useState<string>("");
  const [forceUpdate, setForceUpdate] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

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

    console.log("Validating step:", step);
    console.log("Fields:", fieldsToValidate);
    console.log("Is valid:", isValid);
    console.log("Errors:", errors);

    return isValid;
  };

  const handleServiceToggle = useCallback((service: string) => {
    const currentServices = getValues("services") || [];
    const updatedServices = currentServices.includes(service)
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    setValue("services", updatedServices, { shouldValidate: true });
  }, [setValue, getValues]);

  const handlePhotoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const currentPhotos = getValues("photos") || [];

    // Clear previous error
    setPhotoUploadError("");

    // Track rejected files for user feedback
    const rejectedFiles: string[] = [];

    // Allowed image formats for profile photos (security-safe raster formats only)
    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    const validFiles = files.filter(file => {
      const isValidType = ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase());
      const isValidSize = file.size <= 10 * 1024 * 1024;

      if (!isValidType) {
        rejectedFiles.push(`${file.name} (only JPG, PNG, and WebP allowed)`);
      } else if (!isValidSize) {
        rejectedFiles.push(`${file.name} (exceeds 10MB)`);
      }

      return isValidType && isValidSize;
    });

    // Check if adding would exceed limit
    const totalPhotos = currentPhotos.length + validFiles.length;
    const photosToAdd = validFiles.slice(0, Math.max(0, 5 - currentPhotos.length));
    const exceededLimit = totalPhotos > 5;

    // Set error message if there are rejected files or limit exceeded
    if (rejectedFiles.length > 0) {
      setPhotoUploadError(`Rejected: ${rejectedFiles.join(", ")}`);
    } else if (exceededLimit) {
      setPhotoUploadError(`Only ${photosToAdd.length} photo(s) added. Maximum 5 photos allowed.`);
    }

    const newPhotos = [...currentPhotos, ...photosToAdd].slice(0, 5);
    setValue("photos", newPhotos, { shouldValidate: true });
  }, [setValue, getValues]);

  const removePhoto = useCallback((index: number) => {
    const currentPhotos = getValues("photos") || [];
    const updatedPhotos = currentPhotos.filter((_, i) => i !== index);
    setValue("photos", updatedPhotos, { shouldValidate: true });
    // Clear error when removing photos
    setPhotoUploadError("");
  }, [setValue, getValues]);

  const nextStep = async () => {
    if (currentStep < TOTAL_STEPS) {
      const isValid = await validateCurrentStep(currentStep);
      if (isValid) {
        setCurrentStep(currentStep + 1);
      } else {
        // Validation failed - errors are now visible via trigger()
        console.log("Validation failed for step:", currentStep, errors);

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
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: ContractorFormData) => {
    try {
      console.log("🚀 Submitting worker registration...");
      setIsLoading(true);

      // Step 1: Upload photos to Vercel Blob first (if photos exist)
      let photoUrls: string[] = [];

      if (data.photos && data.photos.length > 0) {
        console.log(`📸 Uploading ${data.photos.length} photos...`);

        const formData = new FormData();
        formData.append('email', data.email);

        // Append all photo files
        data.photos.forEach((photo: File) => {
          formData.append('photos', photo);
        });

        // Upload photos
        const photoUploadResponse = await fetch('/api/upload/worker-photos', {
          method: 'POST',
          body: formData,
        });

        const photoResult = await photoUploadResponse.json();

        if (!photoUploadResponse.ok) {
          console.error("❌ Photo upload failed:", photoResult.error);
          alert(`Photo upload failed: ${photoResult.error}`);
          setIsLoading(false);
          return;
        }

        photoUrls = photoResult.urls;
        console.log(`✅ Photos uploaded successfully:`, photoUrls);

        if (photoResult.warnings && photoResult.warnings.length > 0) {
          console.warn("⚠️ Photo upload warnings:", photoResult.warnings);
        }
      }

      // Step 2: Submit registration with photo URLs
      const registrationData = {
        ...data,
        photos: photoUrls, // Replace File objects with URLs
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle error
        console.error("❌ Registration failed:", result.error);
        alert(`Registration failed: ${result.error}`);
        setIsLoading(false);
        return;
      }

      // Success!
      console.log("✅ Registration successful:", result);

      // Redirect to login page
      window.location.href = `/login?registered=true`;
    } catch (error) {
      console.error("❌ Error during submission:", error);
      alert("An error occurred during registration. Please try again.");
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
    console.log("❌ Form validation errors:", errors);
    Object.keys(errors).forEach(key => {
      console.log(`Field: ${key}, Message: ${errors[key]?.message}, Type: ${errors[key]?.type}`);
    });
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
          <CardContent className="space-y-6 px-6 sm:px-8 lg:px-12 py-8">
            {/* Conditional rendering - only renders the active step */}
            {currentStep === 1 && (
              <Step1Location control={control} errors={errors} />
            )}

            {currentStep === 2 && (
              <Step1PersonalInfo
                control={control}
                errors={errors}
              />
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
              <Step3Services
                control={control}
                errors={errors}
                watchedServices={watchedServices}
                supportWorkerCategories={watchedSupportWorkerCategories || []}
                serviceOptions={SERVICE_OPTIONS}
                handleServiceToggle={handleServiceToggle}
                setValue={setValue}
              />
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
                  {isLoading ? "Submitting..." : "Complete Signup"}
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
