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
import { Step3Address } from "@/components/forms/clientRegistration/Step3Address";
import { Step4Relationship } from "@/components/forms/clientRegistration/Step4Relationship";
import { Step5ClientInfo } from "@/components/forms/clientRegistration/Step5ClientInfo";
import { clientFormSchema, type ClientFormData, clientFormDefaults } from "@/schema/clientFormSchema";

export default function ClientsRegistration() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, formState, trigger, getValues, watch } = useForm<ClientFormData>({
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
  // Client path: 5 steps (Who, Personal, Address, Relationship, Client Info)
  // Coordinator path: 3 steps (Who, Personal, Address) - for now
  const TOTAL_STEPS = completingFormAs === "client" ? 5 : 3;

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const validateCurrentStep = async (step: number) => {
    let fieldsToValidate: (keyof ClientFormData)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate = ["completingFormAs"];
        break;
      case 2:
        fieldsToValidate = ["firstName", "lastName", "email", "phoneNumber"];
        break;
      case 3:
        fieldsToValidate = ["streetAddress", "location"];
        break;
      case 4:
        // Only validate relationship if user is on client path
        if (completingFormAs === "client") {
          fieldsToValidate = ["relationshipToClient"];
        }
        break;
      case 5:
        // Only validate client info if user is on client path
        if (completingFormAs === "client") {
          fieldsToValidate = ["clientFirstName", "clientLastName", "clientDateOfBirth"];
        }
        break;
      // Add more cases as steps are added
    }

    const isValid = await trigger(fieldsToValidate, { shouldFocus: true });
    return isValid;
  };

  const nextStep = async () => {
    if (currentStep < TOTAL_STEPS) {
      const isValid = await validateCurrentStep(currentStep);
      if (isValid) {
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
              <Step1WhoIsCompleting control={control} errors={errors} />
            )}

            {currentStep === 2 && (
              <Step2PersonalInfo control={control} errors={errors} />
            )}

            {currentStep === 3 && (
              <Step3Address control={control} errors={errors} />
            )}

            {currentStep === 4 && completingFormAs === "client" && (
              <Step4Relationship control={control} errors={errors} />
            )}

            {currentStep === 5 && completingFormAs === "client" && (
              <Step5ClientInfo control={control} errors={errors} />
            )}

            {/* Additional steps will be added here */}

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
