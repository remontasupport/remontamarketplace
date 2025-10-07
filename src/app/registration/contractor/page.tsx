"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Step1PersonalInfo } from "../../../components/forms/workerRegistration/Step1PersonalInfo";
import { Step2AdditionalDetails } from "../../../components/forms/workerRegistration/Step2AdditionalDetails";
import { Step3Professional } from "../../../components/forms/workerRegistration/Step3Professional";
import { Step4Services } from "../../../components/forms/workerRegistration/Step4Services";
import { Step5PersonalTouch } from "../../../components/forms/workerRegistration/Step5PersonalTouch";
import { Step6Photos } from "../../../components/forms/workerRegistration/Step6Photos";
import { Step7Verification } from "../../../components/forms/workerRegistration/Step7Verification";
import { contractorFormSchema, type ContractorFormData, contractorFormDefaults } from "@/schema/contractorFormSchema";
import { SERVICE_OPTIONS, TOTAL_STEPS } from "@/constants";
import { getStepValidationFields, isValidAustralianMobile } from "@/utils/registrationUtils";


export default function ContractorOnboarding() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isChangingNumber, setIsChangingNumber] = useState(false);
  const [tempMobile, setTempMobile] = useState("");

  const { register, control, handleSubmit, formState: { errors }, trigger, getValues, setValue, watch } = useForm<ContractorFormData>({
    resolver: zodResolver(contractorFormSchema),
    mode: "onChange",
    defaultValues: contractorFormDefaults,
  });

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const watchedServices = watch("services");
  const watchedPhotos = watch("photos");
  const watchedMobile = watch("mobile");
  const watchedConsentProfileShare = watch("consentProfileShare");
  const watchedConsentMarketing = watch("consentMarketing");
  const watchedHasVehicle = watch("hasVehicle");

  const validateCurrentStep = async (step: number) => {
    if (step === 7) {
      return isVerified;
    }

    const fieldsToValidate = getStepValidationFields(step);
    const result = await trigger(fieldsToValidate);
    return result;
  };

  const handleServiceToggle = (service: string) => {
    const currentServices = watchedServices || [];
    const updatedServices = currentServices.includes(service)
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    setValue("services", updatedServices);
    trigger("services");
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024;
      return isValidType && isValidSize;
    });

    const currentPhotos = watchedPhotos || [];
    const newPhotos = [...currentPhotos, ...validFiles].slice(0, 5);
    setValue("photos", newPhotos);
    trigger("photos");
  };

  const removePhoto = (index: number) => {
    const currentPhotos = watchedPhotos || [];
    const updatedPhotos = currentPhotos.filter((_, i) => i !== index);
    setValue("photos", updatedPhotos);
    trigger("photos");
  };

  const sendVerificationCode = async () => {
    const mobile = getValues("mobile");

    try {
      const response = await fetch('/api/sms/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsCodeSent(true);
        if (data.devCode) {
          setSentCode(data.devCode);
          console.log('🔐 Verification code received');
        }
      } else {
        console.error('SMS Error Details:', data);
        alert(data.error || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      alert('Failed to send verification code. Please try again.');
    }
  };

  const verifyCode = () => {
    if (verificationCode.length !== 6) {
      alert('Please enter a valid 6-digit code');
      return;
    }

    if (verificationCode === sentCode) {
      setIsVerified(true);
      console.log('✅ Phone number verified successfully');
    } else {
      alert('Invalid verification code');
    }
  };

  const handleChangeNumber = () => {
    setIsChangingNumber(true);
    setTempMobile(getValues("mobile"));
  };

  const handleSaveNewNumber = async () => {
    if (isValidAustralianMobile(tempMobile)) {
      setValue("mobile", tempMobile);
      await trigger("mobile");

      setIsChangingNumber(false);
      setIsCodeSent(false);
      setVerificationCode("");
      setSentCode("");
      setIsVerified(false);
    } else {
      alert("Please enter a valid Australian mobile number");
    }
  };

  const handleCancelChangeNumber = () => {
    setIsChangingNumber(false);
    setTempMobile("");
    setIsCodeSent(false);
    setVerificationCode("");
    setSentCode("");
  };

  const nextStep = async () => {
    if (currentStep < TOTAL_STEPS) {
      const isValid = await validateCurrentStep(currentStep);
      if (isValid) {
        setCurrentStep(currentStep + 1);
      } else {
        const firstError = Object.values(errors)[0];
        const errorMessage = firstError?.message || "Please fill all required fields correctly";
        alert(`Step ${currentStep} validation failed:\n${errorMessage}`);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: ContractorFormData) => {
    console.log("🎯 onSubmit function called!");
    console.log("📦 Raw data received:", data);

    try {
      console.log("🚀 FORM SUBMISSION - Complete Registration Data:");
      console.log(JSON.stringify(data, null, 2));
      console.log("📊 Summary:", {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        mobile: data.mobile,
        role: data.titleRole,
        services: data.services,
        photosCount: data.photos?.length || 0
      });

      console.log("✅ Registration completed successfully!");
      alert("✅ Registration completed successfully!\n\nYour data has been logged to the console.");
    } catch (error) {
      console.error("❌ Error during submission:", error);
      alert(`❌ Submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };


  if (showWelcome) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardContent className="p-12 text-center space-y-6">
              <div className="space-y-6">
                <h1 className="text-4xl text-gray-900 font-cooper">
                  Welcome to Remonta
                </h1>
                <div className="bg-[#EDEFF3] rounded-lg p-6 text-left max-w-lg mx-auto">
                  <p className="text-lg text-[#0C1628] font-poppins font-medium mb-4">
                    There are thousands of people on Remonta looking for support workers just like you. Create your account today:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-800 font-poppins">Receive paid training</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-800 font-poppins">Hireup handles your tax, super and benefits</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-800 font-poppins">No experience necessary</span>
                    </li>
                  </ul>
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
    alert("Please check all required fields are filled correctly.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
              <Step1PersonalInfo control={control} errors={errors} />
            </div>
            <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
              <Step2AdditionalDetails register={register} errors={errors} currentStep={currentStep} />
            </div>
            <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
              <Step3Professional register={register} control={control} errors={errors} currentStep={currentStep} />
            </div>
            <div style={{ display: currentStep === 4 ? 'block' : 'none' }}>
              <Step4Services
                register={register}
                errors={errors}
                watchedServices={watchedServices}
                watchedHasVehicle={watchedHasVehicle}
                serviceOptions={SERVICE_OPTIONS}
                handleServiceToggle={handleServiceToggle}
                setValue={setValue}
                trigger={trigger}
                currentStep={currentStep}
              />
            </div>
            <div style={{ display: currentStep === 5 ? 'block' : 'none' }}>
              <Step5PersonalTouch register={register} errors={errors} />
            </div>
            <div style={{ display: currentStep === 6 ? 'block' : 'none' }}>
              <Step6Photos
                errors={errors}
                watchedPhotos={watchedPhotos}
                watchedConsentProfileShare={watchedConsentProfileShare}
                watchedConsentMarketing={watchedConsentMarketing}
                handlePhotoUpload={handlePhotoUpload}
                removePhoto={removePhoto}
                setValue={setValue}
                trigger={trigger}
              />
            </div>
            <div style={{ display: currentStep === 7 ? 'block' : 'none' }}>
              <Step7Verification
                watchedMobile={watchedMobile}
                isCodeSent={isCodeSent}
                isVerified={isVerified}
                isChangingNumber={isChangingNumber}
                verificationCode={verificationCode}
                tempMobile={tempMobile}
                setVerificationCode={setVerificationCode}
                setTempMobile={setTempMobile}
                sendVerificationCode={sendVerificationCode}
                verifyCode={verifyCode}
                handleChangeNumber={handleChangeNumber}
                handleSaveNewNumber={handleSaveNewNumber}
                handleCancelChangeNumber={handleCancelChangeNumber}
                setIsCodeSent={setIsCodeSent}
                setIsVerified={setIsVerified}
              />
            </div>

            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              {currentStep === TOTAL_STEPS ? (
                <Button
                  type="submit"
                  disabled={!isVerified}
                  className={`flex items-center gap-2 ${!isVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Complete Signup
                </Button>
              ) : (
                <Button type="button" onClick={nextStep} className="flex items-center gap-2">
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
