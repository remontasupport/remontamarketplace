export interface Question {
  id: string
  type: 'text' | 'radio' | 'checkbox' | 'select' | 'textarea' | 'email' | 'tel' | 'password' | 'date' | 'search'
  title: string
  subtitle?: string
  placeholder?: string
  required?: boolean
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  options?: { label: string; value: string }[]
  conditionalLogic?: {
    showIf?: {
      field: string
      value: any
    }
  }
}

export const onboardingQuestions: Question[] = [
  {
    id: 'location',
    type: 'search',
    title: 'Where are you located?',
    placeholder: 'Search postcode/suburb',
    required: true,
    validation: {
      min: 2,
      message: 'Please enter a valid location'
    }
  },
  {
    id: 'supportType',
    type: 'radio',
    title: 'What type of support would you like to provide?',
    required: true,
    options: [
      { label: 'Disability Services to Other', value: 'disability-services' },
      { label: 'Support Worker', value: 'support-worker' },
      { label: 'Home Maintenance', value: 'home-maintenance' }
    ]
  },
  {
    id: 'showRestrictions',
    type: 'checkbox',
    title: '',
    options: [
      { label: 'Show restrictions and guidelines', value: 'show-restrictions' }
    ]
  },
  {
    id: 'hoursPerWeek',
    type: 'radio',
    title: 'How many hours per week are you available?',
    required: true,
    options: [
      { label: '1-5 hrs', value: '1-5' },
      { label: '6-10 hrs', value: '6-10' },
      { label: '11-15 hrs', value: '11-15' },
      { label: 'More than 15 hrs', value: '15+' }
    ]
  },
  {
    id: 'startDate',
    type: 'date',
    title: 'When can you start?',
    required: true
  },
  {
    id: 'abilities',
    type: 'checkbox',
    title: 'Select your abilities:',
    options: [
      { label: 'Generalist ability', value: 'generalist' },
      { label: 'Specialist ability', value: 'specialist' },
      { label: 'Independent', value: 'independent' }
    ]
  },
  {
    id: 'firstName',
    type: 'text',
    title: 'Personal Details',
    subtitle: 'First Name',
    placeholder: 'Enter your first name',
    required: true,
    validation: {
      min: 2,
      message: 'First name must be at least 2 characters'
    }
  },
  {
    id: 'lastName',
    type: 'text',
    title: '',
    subtitle: 'Last Name',
    placeholder: 'Enter your last name',
    required: true,
    validation: {
      min: 2,
      message: 'Last name must be at least 2 characters'
    }
  },
  {
    id: 'email',
    type: 'email',
    title: '',
    subtitle: 'Email',
    placeholder: 'Enter your email address',
    required: true,
    validation: {
      pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
      message: 'Please enter a valid email address'
    }
  },
  {
    id: 'mobileNumber',
    type: 'tel',
    title: '',
    subtitle: 'Mobile Number',
    placeholder: 'Enter your mobile number',
    required: true,
    validation: {
      pattern: '^[0-9]{10}$',
      message: 'Mobile number must be 10 digits'
    }
  },
  {
    id: 'password',
    type: 'password',
    title: '',
    subtitle: 'Password',
    placeholder: 'Create a password',
    required: true,
    validation: {
      min: 8,
      message: 'Password must be at least 8 characters'
    }
  },
  {
    id: 'verificationCode',
    type: 'text',
    title: 'Verify your mobile number',
    subtitle: 'Enter 6-digit verification code',
    placeholder: '000000',
    required: true,
    validation: {
      pattern: '^[0-9]{6}$',
      message: 'Please enter a 6-digit code'
    }
  }
]

// Group questions into steps for better UX
export const questionSteps = [
  {
    title: 'Location',
    questions: ['location']
  },
  {
    title: 'Support Type',
    questions: ['supportType', 'showRestrictions']
  },
  {
    title: 'Availability',
    questions: ['hoursPerWeek', 'startDate', 'abilities']
  },
  {
    title: 'Personal Details',
    questions: ['firstName', 'lastName', 'email', 'mobileNumber', 'password']
  },
  {
    title: 'Verification',
    questions: ['verificationCode']
  }
]