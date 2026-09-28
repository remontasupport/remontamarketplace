// The worker sign-up step fields moved to features/worker-registration/formSchema.ts (S1).

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
