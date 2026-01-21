"use client";

import { useState } from "react";
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
import { useCategories } from "@/hooks/queries/useCategories";

export default function ClientsRegistration() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showAccountSetupErrors, setShowAccountSetupErrors] = useState(false);

  // Fetch categories from database
  const { data: categories, isLoading: categoriesLoading, isError: categoriesError } = useCategories();

  const { control, handleSubmit, formState, trigger, getValues, watch, setValue } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    mode: "onTouched",
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
  // Client (assisting someone): 7 steps (Who, Personal, Funding Type + Relationship, Services, Address, Account, Client Info)
  // Self (registering for myself): 6 steps (Who, Personal, Funding Type, Services, Address, Account)
  // Coordinator path: 5 steps (Who, Personal, Services, Address, Account)
  const TOTAL_STEPS = completingFormAs === "client" ? 7 : completingFormAs === "self" ? 6 : 5;

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
        } else {
          fieldsToValidate = ["firstName", "lastName", "phoneNumber"];
        }
        break;
      case 3:
        // For client path: validate funding type and relationship
        // For self path: validate funding type only
        // For coordinator: validate services
        if (completingFormAs === "client") {
          fieldsToValidate = ["fundingType", "relationshipToClient"];
        } else if (completingFormAs === "self") {
          fieldsToValidate = ["fundingType"];
        } else {
          fieldsToValidate = ["servicesRequested"];
        }
        break;
      case 4:
        // For client/self path: services; for coordinator: location
        if (completingFormAs === "client" || completingFormAs === "self") {
          fieldsToValidate = ["servicesRequested"];
        } else {
          fieldsToValidate = ["location"];
        }
        break;
      case 5:
        // For client/self path: location; for coordinator: account setup
        if (completingFormAs === "client" || completingFormAs === "self") {
          fieldsToValidate = ["location"];
        } else {
          fieldsToValidate = ["email", "password", "consent"];
        }
        break;
      case 6:
        // Client/self path: account setup
        if (completingFormAs === "client" || completingFormAs === "self") {
          fieldsToValidate = ["email", "password", "consent"];
        }
        break;
      case 7:
        // Client path only: client info (self path ends at step 6)
        if (completingFormAs === "client") {
          fieldsToValidate = ["clientFirstName", "clientLastName", "clientDateOfBirth"];
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
        // Reset account setup errors when navigating forward
        setShowAccountSetupErrors(false);
        setCurrentStep(currentStep + 1);
      } else {
        // Show account setup errors if validation fails on step 6 (client path)
        if (currentStep === 6 && completingFormAs === "client") {
          setShowAccountSetupErrors(true);
        }
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
      // Reset account setup errors when navigating back
      setShowAccountSetupErrors(false);
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: ClientFormData) => {
    try {
      setIsLoading(true);
      console.log("Client registration data:", data);
      // TODO: Implement API call to register client
      alert("Registration submitted! (API integration pending)");
    } catch (error: any) {
      alert(`Registration failed: ${error.message}`);
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

  const onError = (formErrors: any) => {
    // Only show account setup errors if we're actually on the account setup step
    const isOnAccountSetupStep =
      (completingFormAs === "coordinator" && currentStep === 5) ||
      ((completingFormAs === "self" || completingFormAs === "client") && currentStep === 6);

    if (isOnAccountSetupStep && completingFormAs !== "client") {
      // Self/Coordinator path: show account setup errors only when on that step
      setShowAccountSetupErrors(true);
    }

    // Only mark fields for the current (final) step as touched
    let finalStepFields: (keyof ClientFormData)[] = [];

    if (completingFormAs === "client") {
      // Client path final step: client info
      finalStepFields = ["clientFirstName", "clientLastName", "clientDateOfBirth"];
    } else {
      // Self/Coordinator path final step: account setup
      finalStepFields = ["email", "password", "consent"];
    }

    // Only touch and dirty fields that have errors AND are in the final step
    finalStepFields.forEach(field => {
      if (formErrors[field]) {
        const currentValue = getValues(field);
        setValue(field, currentValue, { shouldTouch: true, shouldDirty: true });
      }
    });

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

            {/* Step 3/4 - Services Requested */}
            {((currentStep === 3 && completingFormAs === "coordinator") ||
              (currentStep === 4 && (completingFormAs === "client" || completingFormAs === "self"))) && (
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

            {/* Step 4/5 - Address */}
            {((currentStep === 4 && completingFormAs === "coordinator") ||
              (currentStep === 5 && (completingFormAs === "client" || completingFormAs === "self"))) && (
              <Step3Address control={control} errors={errors} />
            )}

            {/* Step 5/6 - Account Setup */}
            {((currentStep === 5 && completingFormAs === "coordinator") ||
              (currentStep === 6 && (completingFormAs === "client" || completingFormAs === "self"))) && (
              <Step5AccountSetup control={control} errors={errors} showValidationErrors={showAccountSetupErrors} />
            )}

            {/* Step 7 - Client Info (Client path only) */}
            {currentStep === 7 && completingFormAs === "client" && (
              <Step5ClientInfo control={control} errors={errors} />
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
