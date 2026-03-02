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
import { Step5AccountSetup } from "@/components/forms/clientRegistration/Step5AccountSetup";
import { clientFormSchema, type ClientFormData, clientFormDefaults } from "@/schema/clientFormSchema";

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
  'myself': 'MYSELF',
};

export default function ClientsRegistration() {
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showAccountErrors, setShowAccountErrors] = useState(false);
  const [isSubmitClicked, setIsSubmitClicked] = useState(false);

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

  // Calculate total steps based on path
  // Client (assisting someone): 4 steps (Who, Personal, Funding Type + Relationship, Account)
  // Self (registering for myself): 3 steps (Who, Personal, Account)
  // Coordinator path: 3 steps (Who, Personal, Account)
  const TOTAL_STEPS = completingFormAs === "client" ? 4 : 3;

  // Determine if we're on the account setup step
  const isOnAccountSetupStep = currentStep === TOTAL_STEPS;

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const validateCurrentStep = async (step: number) => {
    let fieldsToValidate: (keyof ClientFormData)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate = ["completingFormAs"];
        break;
      case 2:
        if (completingFormAs === "coordinator") {
          fieldsToValidate = ["firstName", "lastName", "phoneNumber", "clientTypes"];
        } else {
          fieldsToValidate = ["firstName", "lastName", "phoneNumber"];
        }
        break;
      case 3:
        if (completingFormAs === "client") {
          // client: funding type + relationship
          fieldsToValidate = ["fundingType", "relationshipToClient"];
        } else {
          // self/coordinator: account setup
          fieldsToValidate = ["email", "password", "consent"];
        }
        break;
      case 4:
        // client only: account setup
        fieldsToValidate = ["email", "password", "consent"];
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
          email: data.email,
          password: data.password,
          consent: data.consent,
        };
      } else {
        // Client or Self registration
        endpoint = '/api/auth/register/client';
        successPath = '/registration/clients/success';
        payload = {
          firstName: data.firstName,
          lastName: data.lastName,
          mobile: data.phoneNumber,
          fundingType: data.fundingType ? FUNDING_TYPE_MAP[data.fundingType] : undefined,
          relationshipToClient: data.relationshipToClient ? RELATIONSHIP_MAP[data.relationshipToClient] : undefined,
          email: data.email,
          password: data.password,
          consent: data.consent,
          completingFormAs: data.completingFormAs,
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
        if (result.details && typeof result.details === 'object') {
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

            {/* Step 3 - Funding Type + Relationship (client path only) */}
            {currentStep === 3 && completingFormAs === "client" && (
              <Step3FundingType control={control} errors={errors} showRelationship={true} />
            )}

            {/* Account Setup - Step 3 (self/coordinator), Step 4 (client) */}
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
