import { ContractorFormData } from "@/schema/contractorFormSchema";

export const getStepValidationFields = (step: number): (keyof ContractorFormData)[] => {
  const fieldMap: Record<number, (keyof ContractorFormData)[]> = {
    1: ["firstName", "lastName", "email", "mobile", "age", "gender"],
    2: ["genderIdentity", "city", "state", "languages"],
    3: ["titleRole", "experience", "introduction"],
    4: ["services", "qualifications", "hasVehicle"],
    5: ["funFact", "hobbies", "uniqueService", "whyEnjoyWork"],
    6: ["photos", "consentProfileShare"],
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
