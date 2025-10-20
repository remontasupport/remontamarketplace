import { ContractorFormData } from "@/schema/contractorFormSchema";

export const getStepValidationFields = (step: number): (keyof ContractorFormData)[] => {
  const fieldMap: Record<number, (keyof ContractorFormData)[]> = {
    1: ["location"],
    2: ["firstName", "lastName", "email", "mobile"],
    3: ["age", "gender", "genderIdentity", "languages"],
    4: ["serviceProvided", "experience", "introduction"],
    5: ["qualifications", "hasVehicle"],
    6: ["funFact", "hobbies", "uniqueService", "whyEnjoyWork"],
    7: ["photos", "consentProfileShare"],
  };

  return fieldMap[step] || [];
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
