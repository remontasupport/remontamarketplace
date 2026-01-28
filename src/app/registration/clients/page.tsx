"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Step1WhoIsCompleting } from "@/components/forms/clientRegistration/Step1WhoIsCompleting";
import { Step2PersonalInfo } from "@/components/forms/clientRegistration/Step2PersonalInfo";
import { Step3FundingType } from "@/components/forms/clientRegistration/Step3FundingType";
import { Step3ServicesRequested } from "@/components/forms/clientRegistration/Step3ServicesRequested";
import { Step3Address } from "@/components/forms/clientRegistration/Step3Address";
import { Step5AccountSetup } from "@/components/forms/clientRegistration/Step5AccountSetup";
import { Step5ClientInfo } from "@/components/forms/clientRegistration/Step5ClientInfo";
import { clientFormSchema, type ClientFormData, clientFormDefaults } from "@/schema/clientFormSchema";
import { useCategories, Category } from "@/hooks/queries/useCategories";

// ============================================
// DATA TRANSFORMATION HELPERS
// ============================================

const FUNDING_TYPE_MAP: Record<string, string> = {
  'ndis': 'NDIS',
  'aged-care': 'AGED_CARE',
  'insurance': 'INSURANCE',
  'private': 'PRIVATE',
  'other': 'OTHER',
};

const RELATIONSHIP_MAP: Record<string, string> = {
  'parent': 'PARENT',
  'legal-guardian': 'LEGAL_GUARDIAN',
  'spouse-partner': 'SPOUSE_PARTNER',
  'children': 'CHILDREN',
  'other': 'OTHER',
};

/**
 * Build servicesRequested object from form data
 * Transforms category IDs and subcategory IDs into the API-expected format
 */
function buildServicesRequested(
  selectedCategories: string[],
  selectedSubcategories: string[],
  categories: Category[]
): Record<string, { categoryName: string; subCategories: { id: string; name: string }[] }> {
  const result: Record<string, { categoryName: string; subCategories: { id: string; name: string }[] }> = {};

  for (const categoryId of selectedCategories) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) continue;

    // Find selected subcategories for this category
    const categorySubcategoryIds = category.subcategories?.map(s => s.id) || [];
    const selectedSubs = selectedSubcategories.filter(id => categorySubcategoryIds.includes(id));

    // Map to subcategory objects with id and name
    const subCategories = selectedSubs.map(subId => {
      const sub = category.subcategories?.find(s => s.id === subId);
      return { id: subId, name: sub?.name || subId };
    });

    result[categoryId] = {
      categoryName: category.name,
      subCategories: subCategories.length > 0 ? subCategories : [],
    };
  }

  return result;
}

export default function ClientsRegistration() {
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showAccountErrors, setShowAccountErrors] = useState(false);
  const [isSubmitClicked, setIsSubmitClicked] = useState(false);

  // Fetch categories from database
  const { data: categories, isLoading: categoriesLoading, isError: categoriesError } = useCategories();

  const { control, handleSubmit, formState, trigger, getValues, watch, setValue } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    mode: "all",
    reValidateMode: "onChange",
    criteriaMode: "all",
    shouldFocusError: true,
    defaultValues: clientFormDefaults,
  });

  const errors = formState.errors;

  // Watch completingFormAs to determine total steps
  const completingFormAs = watch("completingFormAs");
  const serviceSubcategories = watch("serviceSubcategories") || [];

  // Calculate total steps based on path
  // Client (assisting someone): 7 steps (Who, Personal, Funding Type + Relationship, Client Info, Services, Address, Account)
  // Self (registering for myself): 6 steps (Who, Personal, Funding Type, Services, Address, Account)
  // Coordinator path: 6 steps (Who, Personal, Client Info, Services, Address, Account)
  const TOTAL_STEPS = completingFormAs === "client" ? 7 : 6;

  // Determine if we're on the account setup step
  const isOnAccountSetupStep =
    ((completingFormAs === "coordinator" || completingFormAs === "self") && currentStep === 6) ||
    (completingFormAs === "client" && currentStep === 7);

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const validateCurrentStep = async (step: number) => {
    let fieldsToValidate: (keyof ClientFormData)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate = ["completingFormAs"];
        break;
      case 2:
        // Only validate clientTypes for coordinators
        if (completingFormAs === "coordinator") {
          fieldsToValidate = ["firstName", "lastName", "phoneNumber", "clientTypes"];
        } else if (completingFormAs === "self") {
          fieldsToValidate = ["firstName", "lastName", "dateOfBirth", "phoneNumber"];
        } else {
          fieldsToValidate = ["firstName", "lastName", "phoneNumber"];
        }
        break;
      case 3:
        // For client path: validate funding type and relationship
        // For self path: validate funding type only
        // For coordinator: validate client info
        if (completingFormAs === "client") {
          fieldsToValidate = ["fundingType", "relationshipToClient"];
        } else if (completingFormAs === "self") {
          fieldsToValidate = ["fundingType"];
        } else {
          fieldsToValidate = ["clientFirstName", "clientLastName", "clientDateOfBirth"];
        }
        break;
      case 4:
        // For client path: client info; for self/coordinator: services
        if (completingFormAs === "client") {
          fieldsToValidate = ["clientFirstName", "clientLastName", "clientDateOfBirth"];
        } else {
          fieldsToValidate = ["servicesRequested"];
        }
        break;
      case 5:
        // For client path: services; for self/coordinator: location
        if (completingFormAs === "client") {
          fieldsToValidate = ["servicesRequested"];
        } else {
          fieldsToValidate = ["location"];
        }
        break;
      case 6:
        // For client path: location; for self/coordinator: account setup
        if (completingFormAs === "client") {
          fieldsToValidate = ["location"];
        } else {
          fieldsToValidate = ["email", "password", "consent"];
        }
        break;
      case 7:
        // Client path only: account setup
        if (completingFormAs === "client") {
          fieldsToValidate = ["email", "password", "consent"];
        }
        break;
    }

    const isValid = await trigger(fieldsToValidate, { shouldFocus: true });

    // If validation fails, touch and dirty all fields to show error messages
    if (!isValid) {
      fieldsToValidate.forEach(field => {
        const currentValue = getValues(field);
        setValue(field, currentValue, { shouldTouch: true, shouldDirty: true });
      });
    }

    return isValid;
  };

  const nextStep = async () => {
    if (currentStep < TOTAL_STEPS) {
      const isValid = await validateCurrentStep(currentStep);
      if (isValid) {
        setApiError(null);
        // Reset account errors when navigating to account setup step
        if (currentStep + 1 === TOTAL_STEPS) {
          setShowAccountErrors(false);
        }
        setCurrentStep(currentStep + 1);
      } else {
        // Scroll to error
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

  const onSubmit = async (data: ClientFormData) => {
    try {
      setIsLoading(true);
      setApiError(null);

      if (!categories) {
        throw new Error('Categories not loaded. Please refresh the page.');
      }

      // Build servicesRequested object from form data
      const servicesRequested = buildServicesRequested(
        data.servicesRequested,
        data.serviceSubcategories || [],
        categories
      );

      // Build location string - concatenate street address with suburb if provided
      const fullLocation = data.streetAddress?.trim()
        ? `${data.streetAddress.trim()}, ${data.location}`
        : data.location;

      let endpoint: string;
      let payload: Record<string, unknown>;
      let successPath: string;

      if (data.completingFormAs === 'coordinator') {
        // Coordinator registration
        endpoint = '/api/auth/register/coordinator';
        successPath = '/registration/coordinator/success';
        payload = {
          firstName: data.firstName,
          lastName: data.lastName,
          mobile: data.phoneNumber,
          organization: data.organisationName || undefined,
          clientTypes: data.clientTypes || [],
          clientFirstName: data.clientFirstName,
          clientLastName: data.clientLastName,
          clientDateOfBirth: data.clientDateOfBirth,
          servicesRequested,
          additionalInfo: data.additionalInformation || undefined,
          location: fullLocation,
          email: data.email,
          password: data.password,
          consent: data.consent,
        };
      } else {
        // Client or Self registration
        endpoint = '/api/auth/register/client';
        successPath = '/registration/clients/success';
        const isSelfManaged = data.completingFormAs === 'self';

        payload = {
          firstName: data.firstName,
          lastName: data.lastName,
          mobile: data.phoneNumber,
          isSelfManaged,
          fundingType: FUNDING_TYPE_MAP[data.fundingType || 'other'],
          relationshipToClient: isSelfManaged ? 'OTHER' : RELATIONSHIP_MAP[data.relationshipToClient || 'other'],
          dateOfBirth: isSelfManaged ? data.dateOfBirth : data.clientDateOfBirth,
          // For client path (not self-managed), include participant's name
          ...(isSelfManaged ? {} : {
            clientFirstName: data.clientFirstName,
            clientLastName: data.clientLastName,
          }),
          servicesRequested,
          additionalInfo: data.additionalInformation || undefined,
          location: fullLocation,
          email: data.email,
          password: data.password,
          consent: data.consent,
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 409) {
          throw new Error('An account with this email already exists. Please try logging in instead.');
        }
        if (result.details) {
          // Format validation errors
          const errorMessages = Object.values(result.details).join(', ');
          throw new Error(errorMessages || result.error || 'Registration failed');
        }
        throw new Error(result.error || result.message || 'Registration failed');
      }

      // Success - redirect to appropriate success page
      router.push(successPath);
    } catch (error: any) {
      setApiError(error.message || 'Registration failed. Please try again.');
    } finally {
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
                    We're here to help you find the perfect support workers for your needs. Create your account today and get started.
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

  const onError = () => {
    // Only show account setup errors if user explicitly clicked submit button
    if (isOnAccountSetupStep && isSubmitClicked) {
      setShowAccountErrors(true);
    }
    setIsSubmitClicked(false);

    // Scroll to first error
    setTimeout(() => {
      const firstErrorElement = document.querySelector('.text-red-500');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
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
              <Step1WhoIsCompleting control={control} errors={errors} />
            )}

            {currentStep === 2 && (
              <Step2PersonalInfo control={control} errors={errors} completingFormAs={completingFormAs} />
            )}

            {/* Step 3 - Funding Type (Client/Self path only) */}
            {currentStep === 3 && completingFormAs === "client" && (
              <Step3FundingType control={control} errors={errors} showRelationship={true} />
            )}
            {currentStep === 3 && completingFormAs === "self" && (
              <Step3FundingType control={control} errors={errors} showRelationship={false} />
            )}

            {/* Step 3 - Client Info (Coordinator path - about the person needing support) */}
            {currentStep === 3 && completingFormAs === "coordinator" && (
              <Step5ClientInfo control={control} errors={errors} showAddMoreNote />
            )}

            {/* Step 4 - Client Info (Client path only - right after funding type) */}
            {currentStep === 4 && completingFormAs === "client" && (
              <Step5ClientInfo control={control} errors={errors} />
            )}

            {/* Services Requested - Step 4 (coordinator/self), Step 5 (client) */}
            {((currentStep === 4 && (completingFormAs === "coordinator" || completingFormAs === "self")) ||
              (currentStep === 5 && completingFormAs === "client")) && (
              <>
                {categoriesLoading && (
                  <div className="text-center py-4">
                    <p className="text-gray-600 font-poppins">Loading services...</p>
                  </div>
                )}
                {categoriesError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-600 text-sm font-poppins">
                      Failed to load services. Please refresh the page.
                    </p>
                  </div>
                )}
                {!categoriesLoading && !categoriesError && categories && (
                  <Step3ServicesRequested
                    control={control}
                    errors={errors}
                    categories={categories}
                    setValue={setValue}
                    serviceSubcategories={serviceSubcategories}
                  />
                )}
              </>
            )}

            {/* Address - Step 5 (coordinator/self), Step 6 (client) */}
            {((currentStep === 5 && (completingFormAs === "coordinator" || completingFormAs === "self")) ||
              (currentStep === 6 && completingFormAs === "client")) && (
              <Step3Address control={control} errors={errors} />
            )}

            {/* Account Setup - Step 6 (coordinator/self), Step 7 (client) */}
            {isOnAccountSetupStep && (
              <Step5AccountSetup control={control} errors={errors} showErrors={showAccountErrors} />
            )}

            {/* API Error Display */}
            {apiError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm font-poppins">{apiError}</p>
              </div>
            )}

            <div className="flex justify-between pt-6">
              {/* Hide Previous button on Steps 1 and 2 - user must refresh to restart */}
              {currentStep <= 2 ? (
                <div />
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
              )}

              {currentStep === TOTAL_STEPS ? (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2"
                  onClick={() => setIsSubmitClicked(true)}
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
