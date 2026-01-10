import { ContractorFormData } from "@/schema/contractorFormSchema";

// Move fieldMap outside function to prevent recreation on every call
const STEP_VALIDATION_FIELDS: Record<number, (keyof ContractorFormData)[]> = {
  1: ["location"],
  2: ["firstName", "lastName", "email", "mobile", "password"],
  3: ["services"],
  4: ["consentProfileShare"],
};

export const getStepValidationFields = (step: number): (keyof ContractorFormData)[] => {
  return STEP_VALIDATION_FIELDS[step] || [];
};

export const isValidAustralianMobile = (mobile: string): boolean => {
  const cleanMobile = mobile.replace(/\D/g, '');
  return (
    (cleanMobile.length === 10 && cleanMobile.startsWith('04')) ||
    (cleanMobile.length === 11 && cleanMobile.startsWith('614')) ||
    (mobile.startsWith('+61') && cleanMobile.length === 11 && cleanMobile.startsWith('614'))
  );
};

export const calculateProgress = (currentStep: number, totalSteps: number): number => {
  return (currentStep / totalSteps) * 100;
};
