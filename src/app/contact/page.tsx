'use client'

import { useState } from "react"
import Footer from "@/components/ui/layout/Footer"
import Image from "next/image"
import Link from "next/link"

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  feedbackType: string
  message: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  feedbackType?: string
  message?: string
}

interface ModalFormData {
  supportType: string
  email: string
  firstName: string
  lastName: string
  pronouns: string
  enquiryAbout: string
  subject: string
  description: string
}

interface ModalFormErrors {
  email?: string
  firstName?: string
  lastName?: string
  subject?: string
  description?: string
}

export default function ContactPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    feedbackType: '',
    message: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Modal form state
  const [modalFormData, setModalFormData] = useState<ModalFormData>({
    supportType: 'Community Support',
    email: '',
    firstName: '',
    lastName: '',
    pronouns: '',
    enquiryAbout: '',
    subject: '',
    description: '',
  })
  const [modalErrors, setModalErrors] = useState<ModalFormErrors>({})
  const [isModalSubmitting, setIsModalSubmitting] = useState(false)
  const [modalSubmitStatus, setModalSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }

    // Australian phone number validation
    // Accepts formats: 04XX XXX XXX, +61 4XX XXX XXX, 0412345678, +61412345678
    if (formData.phone.trim()) {
      const phoneRegex = /^(\+?61|0)[4-5]\d{8}$/
      const cleanedPhone = formData.phone.replace(/[\s\-()]/g, '')

      if (!phoneRegex.test(cleanedPhone)) {
        newErrors.phone = 'Please enter a valid Australian mobile number'
      }
    }

    if (!formData.feedbackType) {
      newErrors.feedbackType = 'Please select a feedback type'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  // Handle radio button change
  const handleRadioChange = (value: string) => {
    setFormData((prev) => ({ ...prev, feedbackType: value }))
    if (errors.feedbackType) {
      setErrors((prev) => ({ ...prev, feedbackType: undefined }))
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitStatus('idle')

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/send-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback')
      }

      setSubmitStatus('success')
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        feedbackType: '',
        message: '',
      })

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle')
      }, 5000)
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setSubmitStatus('error')

      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle')
      }, 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Validate modal form
  const validateModalForm = (): boolean => {
    const newErrors: ModalFormErrors = {}

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!modalFormData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(modalFormData.email)) {
      newErrors.email = 'Invalid email address'
    }

    if (!modalFormData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!modalFormData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!modalFormData.subject.trim()) {
      newErrors.subject = 'Subject is required'
    }

    if (!modalFormData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (modalFormData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    }

    setModalErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle modal input change
  const handleModalInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setModalFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error for this field when user starts typing
    if (modalErrors[name as keyof ModalFormErrors]) {
      setModalErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  // Handle modal form submission
  const handleModalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setModalSubmitStatus('idle')

    if (!validateModalForm()) {
      return
    }

    setIsModalSubmitting(true)

    try {
      const response = await fetch('/api/send-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modalFormData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit contact form')
      }

      setModalSubmitStatus('success')
      // Reset form
      setModalFormData({
        supportType: 'Community Support',
        email: '',
        firstName: '',
        lastName: '',
        pronouns: '',
        enquiryAbout: '',
        subject: '',
        description: '',
      })

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setModalSubmitStatus('idle')
      }, 5000)
    } catch (error) {
      console.error('Error submitting contact form:', error)
      setModalSubmitStatus('error')

      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        setModalSubmitStatus('idle')
      }, 5000)
    } finally {
      setIsModalSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="order-2 lg:order-1">
              <h1 className="text-4xl md:text-5xl lg:text-6xl text-[#0C1628] mb-6 font-cooper">
                Need Assistance?
              </h1>

              <p className="text-lg md:text-xl text-[#0C1628] mb-4 font-poppins">
                Have any questions about Remonta?
              </p>

              <p className="text-lg  md:text-lg text-[#0C1628] mb-8 font-poppins">
                Get in touch with this form and we'll get back to you as soon as possible.
              </p>

              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center rounded-full px-8 py-3 bg-[#0C1628] text-white font-sans font-medium text-base hover:bg-[#B1C3CD] hover:text-[#0C1628] transition-colors duration-300"
              >
                Contact us
              </button>
            </div>

            {/* Right Image */}
            <div className="order-1 lg:order-2">
              <div className="relative w-full aspect-[3/3] lg:aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/contactMainPhoto.webp"
                  alt="Customer support representative"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        
      </section>

      {/* Feedback Section */}
      <section className="relative overflow-hidden bg-[#EDEFF3] py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Right Side - Content (First on mobile) */}
            <div className="text-left lg:pl-8 order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl lg:text-5xl text-[#0C1628] mb-6 font-cooper">
                Complaints, feedback, compliments?
              </h2>

              <p className="text-base md:text-lg text-[#0C1628] mb-8 font-poppins">
                If you would like to submit a complaint, feedback, or a compliment, please complete this form and our team will respond as soon as possible.
              </p>

              {/* Contact Information */}
              <div className="mt-12 flex flex-wrap items-center gap-3">
                <p className="text-base md:text-lg text-[#0C1628] font-poppins">
                  Or call us with your concerns at:
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-[#0C1628]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                  </div>
                  <span className="text-lg font-medium text-[#0C1628] font-poppins">1300 134 153</span>
                </div>
              </div>
            </div>

            {/* Left Side - Form (Second on mobile) */}
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl order-2 lg:order-1">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm lg:text-lg text-[#0C1628] mb-2 font-poppins">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C1628] font-poppins ${
                        errors.firstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1 font-poppins">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm lg:text-lg text-[#0C1628] mb-2 font-poppins">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C1628] font-poppins ${
                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1 font-poppins">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm lg:text-lg text-[#0C1628] mb-2 font-poppins">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C1628] font-poppins ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1 font-poppins">{errors.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm lg:text-lg text-[#0C1628] mb-2 font-poppins">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. 0412 345 678"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C1628] font-poppins ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1 font-poppins">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm lg:text-lg text-[#0C1628] mb-3 font-poppins">
                    What type of feedback would you like to provide?
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="feedbackType"
                        value="Complaint"
                        checked={formData.feedbackType === 'Complaint'}
                        onChange={(e) => handleRadioChange(e.target.value)}
                        className="w-4 h-4 text-[#0C1628] border-gray-300 focus:ring-[#0C1628]"
                      />
                      <span className="ml-3 text-[#0C1628] font-poppins">Complaint</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="feedbackType"
                        value="Compliment"
                        checked={formData.feedbackType === 'Compliment'}
                        onChange={(e) => handleRadioChange(e.target.value)}
                        className="w-4 h-4 text-[#0C1628] border-gray-300 focus:ring-[#0C1628]"
                      />
                      <span className="ml-3 text-[#0C1628] font-poppins">Compliment</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="feedbackType"
                        value="General Feedback"
                        checked={formData.feedbackType === 'General Feedback'}
                        onChange={(e) => handleRadioChange(e.target.value)}
                        className="w-4 h-4 text-[#0C1628] border-gray-300 focus:ring-[#0C1628]"
                      />
                      <span className="ml-3 text-[#0C1628] font-poppins">General Feedback</span>
                    </label>
                  </div>
                  {errors.feedbackType && (
                    <p className="text-red-500 text-sm mt-2 font-poppins">{errors.feedbackType}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm lg:text-lg text-[#0C1628] mb-2 font-poppins">
                    Your message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C1628] font-poppins ${
                      errors.message ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.message && (
                    <p className="text-red-500 text-sm mt-1 font-poppins">{errors.message}</p>
                  )}
                </div>

                {/* Success Message */}
                {submitStatus === 'success' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h3 className="text-sm font-medium text-green-800 font-poppins">Feedback submitted successfully!</h3>
                        <p className="text-sm text-green-700 mt-1 font-poppins">Thank you for your feedback. We'll get back to you soon.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {submitStatus === 'error' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h3 className="text-sm font-medium text-red-800 font-poppins">Failed to submit feedback</h3>
                        <p className="text-sm text-red-700 mt-1 font-poppins">Please try again later or contact us directly.</p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#0C1628] text-white py-3 rounded-full font-poppins font-medium hover:bg-[#B1C3CD] hover:text-[#0C1628] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Submit'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section className="relative overflow-hidden bg-white py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl lg:text-6xl text-[#0C1628] text-center mb-8 lg:mb-12 font-cooper">
            Other ways to get in touch
          </h2>

          {/* First row - 3 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-4 lg:mb-6">
            {/* General Enquiries Card */}
            <div className="bg-[#EDEFF3] rounded-2xl p-4 lg:p-6 flex flex-col">
              <div className="mb-3">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[#F8E8D8] rounded-full flex items-center justify-center">
                  <Image
                    src="/images/generalEnquiries.svg"
                    alt="General Enquiries"
                    width={64}
                    height={64}
                    className="w-11 h-11 lg:w-14 lg:h-14"
                  />
                </div>
              </div>
              <h3 className="text-lg lg:text-2xl font-semibold text-[#0C1628] mb-2 lg:mb-3 font-poppins">General Enquiries</h3>
              <p className="text-sm lg:text-lg text-[#0C1628] mb-3 lg:mb-4 font-poppins flex-grow">
                For general questions, service information, or new enquiries.
              </p>
              <a
                href="mailto:contact@remontaservices.com.au"
                className="flex items-center gap-2 text-[#0C1628] font-poppins text-xs lg:text-base hover:text-[#0000FF] transition-colors group"
              >
                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-[#0C1628] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span className="border-b border-dashed border-[#0C1628] border-opacity-40 break-all">contact@remontaservices.com.au</span>
                <svg className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform -rotate-45" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            </div>

            {/* Accounts & Billing Card */}
            <div className="bg-[#EDEFF3] rounded-2xl p-4 lg:p-6 flex flex-col">
              <div className="mb-3">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[#F8E8D8] rounded-full flex items-center justify-center">
                  <Image
                    src="/images/accountsBilling.svg"
                    alt="Accounts & Billing"
                    width={64}
                    height={64}
                    className="w-11 h-11 lg:w-14 lg:h-14"
                  />
                </div>
              </div>
              <h3 className="text-lg lg:text-2xl font-semibold text-[#0C1628] mb-2 lg:mb-3 font-poppins">Accounts & Billing</h3>
              <p className="text-sm lg:text-lg text-[#0C1628] mb-3 lg:mb-4 font-poppins flex-grow">
                For invoices, payments, and billing enquiries.
              </p>
              <a
                href="mailto:accounts@remontaservices.com.au"
                className="flex items-center gap-2 text-[#0C1628] font-poppins text-xs lg:text-base hover:text-[#0000FF] transition-colors group"
              >
                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-[#0C1628] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span className="border-b border-dashed border-[#0C1628] border-opacity-40 break-all">accounts@remontaservices.com.au</span>
                <svg className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform -rotate-45" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            </div>

            {/* Support Card */}
            <div className="bg-[#EDEFF3] rounded-2xl p-4 lg:p-6 flex flex-col">
              <div className="mb-3">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[#F8E8D8] rounded-full flex items-center justify-center">
                  <Image
                    src="/images/support.svg"
                    alt="Support"
                    width={64}
                    height={64}
                    className="w-11 h-11 lg:w-14 lg:h-14"
                  />
                </div>
              </div>
              <h3 className="text-lg lg:text-2xl font-semibold text-[#0C1628] mb-2 lg:mb-3 font-poppins">Support</h3>
              <p className="text-sm lg:text-lg text-[#0C1628] mb-3 lg:mb-4 font-poppins flex-grow">
                For help with existing services, support worker requests, or technical assistance.
              </p>
              <a
                href="mailto:support@remontaservices.com.au"
                className="flex items-center gap-2 text-[#0C1628] font-poppins text-xs lg:text-base hover:text-[#0000FF] transition-colors group"
              >
                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-[#0C1628] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span className="border-b border-dashed border-[#0C1628] border-opacity-40 break-all">support@remontaservices.com.au</span>
                <svg className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform -rotate-45" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>

          {/* Second row - 2 cards centered */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 max-w-4xl mx-auto">
            {/* Compliance Card */}
            <div className="bg-[#EDEFF3] rounded-2xl p-4 lg:p-6 flex flex-col">
              <div className="mb-3">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[#F8E8D8] rounded-full flex items-center justify-center">
                  <Image
                    src="/images/compliance.svg"
                    alt="Compliance"
                    width={64}
                    height={64}
                    className="w-11 h-11 lg:w-14 lg:h-14"
                  />
                </div>
              </div>
              <h3 className="text-lg lg:text-2xl font-semibold text-[#0C1628] mb-2 lg:mb-3 font-poppins">Compliance</h3>
              <p className="text-sm lg:text-lg text-[#0C1628] mb-3 lg:mb-4 font-poppins flex-grow">
                For compliance documents, verification, and policy-related enquiries.
              </p>
              <a
                href="mailto:compliance@remontaservices.com.au"
                className="flex items-center gap-2 text-[#0C1628] font-poppins text-xs lg:text-base hover:text-[#0000FF] transition-colors group"
              >
                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-[#0C1628] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span className="border-b border-dashed border-[#0C1628] border-opacity-40 break-all">compliance@remontaservices.com.au</span>
                <svg className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform -rotate-45" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            </div>

            {/* Community Engagement Card */}
            <div className="bg-[#EDEFF3] rounded-2xl p-4 lg:p-6 flex flex-col">
              <div className="mb-3">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[#F8E8D8] rounded-full flex items-center justify-center">
                  <Image
                    src="/images/communityEngagement.svg"
                    alt="Community Engagement"
                    width={64}
                    height={64}
                    className="w-11 h-11 lg:w-14 lg:h-14"
                  />
                </div>
              </div>
              <h3 className="text-lg lg:text-2xl font-semibold text-[#0C1628] mb-2 lg:mb-3 font-poppins">Community Engagement</h3>
              <p className="text-sm lg:text-lg text-[#0C1628] mb-3 lg:mb-4 font-poppins flex-grow">
                For partnerships, events, and community initiatives.
              </p>
              <a
                href="mailto:community@remontaservices.com.au"
                className="flex items-center gap-2 text-[#0C1628] font-poppins text-xs lg:text-base hover:text-[#0000FF] transition-colors group"
              >
                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-[#0C1628] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span className="border-b border-dashed border-[#0C1628] border-opacity-40 break-all">community@remontaservices.com.au</span>
                <svg className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform -rotate-45" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Contact Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl text-[#0C1628] font-cooper">Contact Us</h2>
                <p className="text-sm text-gray-600 font-poppins">Please complete the relevant form below</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleModalSubmit} className="space-y-4">
              {/* Community Support Dropdown */}
              <div>
                <select
                  name="supportType"
                  value={modalFormData.supportType}
                  onChange={handleModalInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded font-poppins text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0C1628]"
                >
                  <option>Community Support</option>
                  <option>General Inquiry</option>
                  <option>Technical Support</option>
                </select>
              </div>

              {/* Your email address */}
              <div>
                <label className="block text-sm font-medium text-[#0C1628] mb-1 font-poppins">
                  Your email address
                </label>
                <input
                  type="email"
                  name="email"
                  value={modalFormData.email}
                  onChange={handleModalInputChange}
                  className={`w-full px-4 py-2 border rounded font-poppins focus:outline-none focus:ring-2 focus:ring-[#0C1628] ${
                    modalErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {modalErrors.email && (
                  <p className="text-red-500 text-xs mt-1 font-poppins">{modalErrors.email}</p>
                )}
              </div>

              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-[#0C1628] mb-1 font-poppins">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={modalFormData.firstName}
                  onChange={handleModalInputChange}
                  className={`w-full px-4 py-2 border rounded font-poppins focus:outline-none focus:ring-2 focus:ring-[#0C1628] ${
                    modalErrors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {modalErrors.firstName && (
                  <p className="text-red-500 text-xs mt-1 font-poppins">{modalErrors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-[#0C1628] mb-1 font-poppins">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={modalFormData.lastName}
                  onChange={handleModalInputChange}
                  className={`w-full px-4 py-2 border rounded font-poppins focus:outline-none focus:ring-2 focus:ring-[#0C1628] ${
                    modalErrors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {modalErrors.lastName && (
                  <p className="text-red-500 text-xs mt-1 font-poppins">{modalErrors.lastName}</p>
                )}
              </div>

              {/* My enquiry is about */}
              <div>
                <label className="block text-sm font-medium text-[#0C1628] mb-1 font-poppins">
                  My enquiry is about:
                </label>
                <select
                  name="enquiryAbout"
                  value={modalFormData.enquiryAbout}
                  onChange={handleModalInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded font-poppins text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0C1628]"
                >
                  <option value="">-</option>
                  <option>General Question</option>
                  <option>Service Inquiry</option>
                  <option>Support Request</option>
                </select>
                <p className="text-xs text-blue-600 mt-1 font-poppins">Choose which best suits your enquiry</p>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-[#0C1628] mb-1 font-poppins">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={modalFormData.subject}
                  onChange={handleModalInputChange}
                  className={`w-full px-4 py-2 border rounded font-poppins focus:outline-none focus:ring-2 focus:ring-[#0C1628] ${
                    modalErrors.subject ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {modalErrors.subject && (
                  <p className="text-red-500 text-xs mt-1 font-poppins">{modalErrors.subject}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[#0C1628] mb-1 font-poppins">
                  Description
                </label>
                <textarea
                  name="description"
                  value={modalFormData.description}
                  onChange={handleModalInputChange}
                  rows={4}
                  className={`w-full px-4 py-2 border rounded font-poppins focus:outline-none focus:ring-2 focus:ring-[#0C1628] ${
                    modalErrors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {modalErrors.description && (
                  <p className="text-red-500 text-xs mt-1 font-poppins">{modalErrors.description}</p>
                )}
                <p className="text-xs text-gray-600 mt-1 font-poppins">
                  Please enter the details of your request. A member of our support staff will respond as soon as possible.
                </p>
              </div>

              {/* Success Message */}
              {modalSubmitStatus === 'success' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-green-800 font-poppins">Message sent successfully!</h3>
                      <p className="text-sm text-green-700 mt-1 font-poppins">We'll respond as soon as possible.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {modalSubmitStatus === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-red-800 font-poppins">Failed to send message</h3>
                      <p className="text-sm text-red-700 mt-1 font-poppins">Please try again later.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isModalSubmitting}
                className="w-full bg-[#0C1628] text-white py-3 rounded-full font-poppins text-md font-medium hover:bg-[#B1C3CD] hover:text-[#0C1628] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isModalSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
