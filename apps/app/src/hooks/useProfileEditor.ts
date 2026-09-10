import { useReducer, useState, useEffect, useRef } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface EditableService {
  categoryId: string
  categoryName: string
  subcategories: { subcategoryName: string }[]
}

export type StringField = 'customJobTitle' | 'introduction' | 'funFact' | 'personality'
export type InfoArrayField = 'editableLanguages' | 'editableCulturalBackground' | 'editableReligion' | 'editableInterests'

export interface EditableProfileState {
  customJobTitle: string
  introduction: string
  funFact: string
  personality: string
  editableServices: EditableService[]
  editableUniqueServices: string[]
  editableLanguages: string[]
  editableCulturalBackground: string[]
  editableReligion: string[]
  editableInterests: string[]
  editableExperienceItems: string[]
  hiddenSections: string[]
}

type Action =
  | { type: 'UPDATE_FIELD'; field: StringField; value: string }
  | { type: 'RESET'; payload: EditableProfileState }
  | { type: 'REMOVE_SERVICE_CATEGORY'; categoryId: string }
  | { type: 'REMOVE_SUBCATEGORY'; categoryId: string; subcategoryName: string }
  | { type: 'ADD_SUBCATEGORY'; categoryId: string; subcategoryName: string }
  | { type: 'TOGGLE_SECTION'; sectionId: string }
  | { type: 'ADD_UNIQUE_SERVICE'; item: string }
  | { type: 'REMOVE_UNIQUE_SERVICE'; item: string }
  | { type: 'ADD_INFO_ITEM'; field: InfoArrayField; item: string }
  | { type: 'REMOVE_INFO_ITEM'; field: InfoArrayField; item: string }
  | { type: 'ADD_EXPERIENCE_ITEM' }
  | { type: 'UPDATE_EXPERIENCE_ITEM'; index: number; value: string }
  | { type: 'REMOVE_EXPERIENCE_ITEM'; index: number }

// ============================================================================
// REDUCER
// ============================================================================

function reducer(state: EditableProfileState, action: Action): EditableProfileState {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return { ...state, [action.field]: action.value }
    case 'RESET':
      return action.payload
    case 'REMOVE_SERVICE_CATEGORY':
      return {
        ...state,
        editableServices: state.editableServices.filter(s => s.categoryId !== action.categoryId),
      }
    case 'REMOVE_SUBCATEGORY':
      return {
        ...state,
        editableServices: state.editableServices.map(s =>
          s.categoryId === action.categoryId
            ? { ...s, subcategories: s.subcategories.filter(sub => sub.subcategoryName !== action.subcategoryName) }
            : s
        ),
      }
    case 'ADD_SUBCATEGORY':
      return {
        ...state,
        editableServices: state.editableServices.map(s =>
          s.categoryId === action.categoryId
            ? { ...s, subcategories: [...s.subcategories, { subcategoryName: action.subcategoryName }] }
            : s
        ),
      }
    case 'TOGGLE_SECTION':
      return {
        ...state,
        hiddenSections: state.hiddenSections.includes(action.sectionId)
          ? state.hiddenSections.filter(id => id !== action.sectionId)
          : [...state.hiddenSections, action.sectionId],
      }
    case 'ADD_UNIQUE_SERVICE':
      if (state.editableUniqueServices.includes(action.item)) return state
      return { ...state, editableUniqueServices: [...state.editableUniqueServices, action.item] }
    case 'REMOVE_UNIQUE_SERVICE':
      return {
        ...state,
        editableUniqueServices: state.editableUniqueServices.filter(i => i !== action.item),
      }
    case 'ADD_INFO_ITEM':
      if (state[action.field].includes(action.item)) return state
      return { ...state, [action.field]: [...state[action.field], action.item] }
    case 'REMOVE_INFO_ITEM':
      return { ...state, [action.field]: state[action.field].filter(i => i !== action.item) }
    case 'ADD_EXPERIENCE_ITEM':
      return { ...state, editableExperienceItems: [...state.editableExperienceItems, 'New experience item'] }
    case 'UPDATE_EXPERIENCE_ITEM':
      return {
        ...state,
        editableExperienceItems: state.editableExperienceItems.map((item, i) => i === action.index ? action.value : item),
      }
    case 'REMOVE_EXPERIENCE_ITEM':
      return {
        ...state,
        editableExperienceItems: state.editableExperienceItems.filter((_, i) => i !== action.index),
      }
    default:
      return state
  }
}

// ============================================================================
// HOOK
// ============================================================================

export function useProfileEditor(
  initialJobTitle: string,
  initialIntroduction: string,
  initialFunFact: string,
  initialServices: EditableService[],
  initialUniqueServices: string[],
  initialMoreInfo: {
    languages: string[]
    culturalBackground: string[]
    religion: string[]
    interests: string[]
    personality: string
  }
) {
  const [isEditMode, setIsEditMode] = useState(false)
  const initialized = useRef(false)

  const [state, dispatch] = useReducer(reducer, {
    customJobTitle: initialJobTitle,
    introduction: initialIntroduction,
    funFact: initialFunFact,
    personality: initialMoreInfo.personality,
    editableServices: initialServices,
    editableUniqueServices: initialUniqueServices,
    editableLanguages: initialMoreInfo.languages,
    editableCulturalBackground: initialMoreInfo.culturalBackground,
    editableReligion: initialMoreInfo.religion,
    editableInterests: initialMoreInfo.interests,
    editableExperienceItems: [],
    hiddenSections: [],
  })

  // Sync once when real data arrives (hook is called before profileData loads)
  useEffect(() => {
    if (initialJobTitle && !initialized.current) {
      dispatch({
        type: 'RESET',
        payload: {
          customJobTitle: initialJobTitle,
          introduction: initialIntroduction,
          funFact: initialFunFact,
          personality: initialMoreInfo.personality,
          editableServices: initialServices,
          editableUniqueServices: initialUniqueServices,
          editableLanguages: initialMoreInfo.languages,
          editableCulturalBackground: initialMoreInfo.culturalBackground,
          editableReligion: initialMoreInfo.religion,
          editableInterests: initialMoreInfo.interests,
          editableExperienceItems: [],
          hiddenSections: [],
        },
      })
      initialized.current = true
    }
  }, [initialJobTitle, initialIntroduction, initialFunFact, initialMoreInfo, initialServices, initialUniqueServices])

  const toggleEditMode = () => setIsEditMode(prev => !prev)

  const updateField = (field: StringField, value: string) => {
    dispatch({ type: 'UPDATE_FIELD', field, value })
  }

  const removeServiceCategory = (categoryId: string) => {
    dispatch({ type: 'REMOVE_SERVICE_CATEGORY', categoryId })
  }

  const removeSubcategory = (categoryId: string, subcategoryName: string) => {
    dispatch({ type: 'REMOVE_SUBCATEGORY', categoryId, subcategoryName })
  }

  const addSubcategory = (categoryId: string, subcategoryName: string) => {
    dispatch({ type: 'ADD_SUBCATEGORY', categoryId, subcategoryName })
  }

  const toggleSection = (sectionId: string) => {
    dispatch({ type: 'TOGGLE_SECTION', sectionId })
  }

  const addUniqueService = (item: string) => {
    dispatch({ type: 'ADD_UNIQUE_SERVICE', item })
  }

  const removeUniqueService = (item: string) => {
    dispatch({ type: 'REMOVE_UNIQUE_SERVICE', item })
  }

  const addInfoItem = (field: InfoArrayField, item: string) => {
    dispatch({ type: 'ADD_INFO_ITEM', field, item })
  }

  const removeInfoItem = (field: InfoArrayField, item: string) => {
    dispatch({ type: 'REMOVE_INFO_ITEM', field, item })
  }

  const addExperienceItem = () => {
    dispatch({ type: 'ADD_EXPERIENCE_ITEM' })
  }

  const updateExperienceItem = (index: number, value: string) => {
    dispatch({ type: 'UPDATE_EXPERIENCE_ITEM', index, value })
  }

  const removeExperienceItem = (index: number) => {
    dispatch({ type: 'REMOVE_EXPERIENCE_ITEM', index })
  }

  return {
    isEditMode,
    toggleEditMode,
    state,
    updateField,
    removeServiceCategory,
    removeSubcategory,
    addSubcategory,
    toggleSection,
    addUniqueService,
    removeUniqueService,
    addInfoItem,
    removeInfoItem,
    addExperienceItem,
    updateExperienceItem,
    removeExperienceItem,
  }
}
