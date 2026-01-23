import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWorkerAdditionalInfo,
  updateWorkerBankAccount,
  updateWorkerWorkHistory,
  updateWorkerEducation,
  updateWorkerGoodToKnow,
  updateWorkerLanguages,
  updateWorkerCulturalBackground,
  updateWorkerReligion,
  updateWorkerInterests,
  updateWorkerAboutMe,
  updateWorkerPersonality,
  updateWorkerWorkPreferences,
} from "@/services/worker/additionalInfo.service";
import type {
  UpdateWorkerBankAccountData,
  UpdateWorkerWorkHistoryData,
  UpdateWorkerEducationData,
  UpdateWorkerGoodToKnowData,
  UpdateWorkerLanguagesData,
  UpdateWorkerCulturalBackgroundData,
  UpdateWorkerReligionData,
  UpdateWorkerInterestsData,
  UpdateWorkerAboutMeData,
  UpdateWorkerPersonalityData,
  UpdateWorkerWorkPreferencesData,
} from "@/schema/workerProfileSchema";

// Query key
const WORKER_PROFILE_KEY = ["worker-profile"];

// Hook to fetch worker profile data
export function useWorkerProfileData() {
  return useQuery({
    queryKey: WORKER_PROFILE_KEY,
    queryFn: async () => {
      const result = await getWorkerAdditionalInfo();
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || "Failed to fetch worker profile");
    },
    staleTime: 0,
    refetchOnMount: true,
  });
}

// Hook to update bank account
export function useUpdateBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateWorkerBankAccountData) => updateWorkerBankAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKER_PROFILE_KEY });
    },
  });
}

// Hook to update work history
export function useUpdateWorkHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateWorkerWorkHistoryData) => updateWorkerWorkHistory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKER_PROFILE_KEY });
    },
  });
}

// Hook to update education
export function useUpdateEducation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateWorkerEducationData) => updateWorkerEducation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKER_PROFILE_KEY });
    },
  });
}

// Hook to update good to know
export function useUpdateGoodToKnow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateWorkerGoodToKnowData) => updateWorkerGoodToKnow(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKER_PROFILE_KEY });
    },
  });
}

// Hook to update languages
export function useUpdateLanguages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateWorkerLanguagesData) => updateWorkerLanguages(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKER_PROFILE_KEY });
    },
  });
}

// Hook to update cultural background
export function useUpdateCulturalBackground() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateWorkerCulturalBackgroundData) => updateWorkerCulturalBackground(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKER_PROFILE_KEY });
    },
  });
}

// Hook to update religion
export function useUpdateReligion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateWorkerReligionData) => updateWorkerReligion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKER_PROFILE_KEY });
    },
  });
}

// Hook to update interests
export function useUpdateInterests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateWorkerInterestsData) => updateWorkerInterests(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKER_PROFILE_KEY });
    },
  });
}

// Hook to update about me
export function useUpdateAboutMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateWorkerAboutMeData) => updateWorkerAboutMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKER_PROFILE_KEY });
    },
  });
}

// Hook to update personality
export function useUpdatePersonality() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateWorkerPersonalityData) => updateWorkerPersonality(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKER_PROFILE_KEY });
    },
  });
}

// Hook to update work preferences
export function useUpdateWorkPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateWorkerWorkPreferencesData) => updateWorkerWorkPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKER_PROFILE_KEY });
    },
  });
}
