import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { questionSteps } from '@/constants/onboardingQuestions'

export interface OnboardingData {
  [key: string]: any
  // Dynamic form data based on question configuration
  location: string
  supportType: string
  showRestrictions: string[]
  hoursPerWeek: string
  startDate: string
  abilities: string[]
  firstName: string
  lastName: string
  email: string
  mobileNumber: string
  password: string
  verificationCode: string
  isVerified: boolean
}

interface OnboardingStore {
  currentStep: number
  data: OnboardingData
  errors: Record<string, string>
  isLoading: boolean

  // Actions
  setCurrentStep: (step: number) => void
  updateField: (field: string, value: any) => void
  setError: (field: string, error: string) => void
  clearError: (field: string) => void
  clearAllErrors: () => void
  nextStep: () => void
  previousStep: () => void
  resetOnboarding: () => void
  completeOnboarding: () => void
  setLoading: (loading: boolean) => void
  canProceedToNextStep: () => boolean
  getTotalSteps: () => number
}

const initialData: OnboardingData = {
  location: '',
  supportType: '',
  showRestrictions: [],
  hoursPerWeek: '',
  startDate: '',
  abilities: [],
  firstName: '',
  lastName: '',
  email: '',
  mobileNumber: '',
  password: '',
  verificationCode: '',
  isVerified: false,
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      currentStep: 0,
      data: initialData,
      errors: {},
      isLoading: false,

      setCurrentStep: (step) => set({ currentStep: step }),

      updateField: (field, value) => {
        set((state) => ({
          data: { ...state.data, [field]: value }
        }))
        // Clear error when field is updated
        get().clearError(field)
      },

      setError: (field, error) =>
        set((state) => ({
          errors: { ...state.errors, [field]: error }
        })),

      clearError: (field) =>
        set((state) => {
          const { [field]: removed, ...rest } = state.errors
          return { errors: rest }
        }),

      clearAllErrors: () => set({ errors: {} }),

      nextStep: () => {
        const { currentStep } = get()
        const totalSteps = questionSteps.length
        if (currentStep < totalSteps - 1) {
          set({ currentStep: currentStep + 1 })
        }
      },

      previousStep: () => {
        const { currentStep } = get()
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 })
        }
      },

      resetOnboarding: () =>
        set({
          currentStep: 0,
          data: initialData,
          errors: {},
          isLoading: false
        }),

      completeOnboarding: () =>
        set((state) => ({
          data: { ...state.data, isVerified: true }
        })),

      setLoading: (loading) => set({ isLoading: loading }),

      canProceedToNextStep: () => {
        const { currentStep, data, errors } = get()
        const currentStepQuestions = questionSteps[currentStep]?.questions || []

        // Check if all required fields in current step are filled and have no errors
        const hasErrors = currentStepQuestions.some(questionId =>
          errors[questionId]
        )

        if (hasErrors) return false

        // Check if required fields are filled (you can enhance this based on question config)
        const requiredFieldsFilled = currentStepQuestions.every(questionId => {
          const value = data[questionId]
          if (Array.isArray(value)) {
            return true // For checkboxes, we allow empty arrays
          }
          return value && value.toString().trim() !== ''
        })

        return requiredFieldsFilled
      },

      getTotalSteps: () => questionSteps.length,
    }),
    {
      name: 'contractor-onboarding',
      partialize: (state) => ({
        currentStep: state.currentStep,
        data: state.data
      }),
    }
  )
)