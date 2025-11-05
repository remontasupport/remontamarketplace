'use client'

import { useState } from "react"
import Footer from "@/components/ui/layout/Footer"
import Image from "next/image"
import { Phone, MessageCircle } from "lucide-react"
import '@/app/styles/contact.css'

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleRadioChange = (value: string) => {
    setFormData((prev) => ({ ...prev, feedbackType: value }))
    if (errors.feedbackType) {
      setErrors((prev) => ({ ...prev, feedbackType: undefined }))
    }
  }

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
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        feedbackType: '',
        message: '',
      })

      setTimeout(() => {
        setSubmitStatus('idle')
      }, 5000)
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setSubmitStatus('error')

      setTimeout(() => {
        setSubmitStatus('idle')
      }, 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

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

  const handleModalInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setModalFormData((prev) => ({ ...prev, [name]: value }))
    if (modalErrors[name as keyof ModalFormErrors]) {
      setModalErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

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

      // Close modal after showing success message briefly
      setTimeout(() => {
        setIsModalOpen(false)
        setModalSubmitStatus('idle')
      }, 2000)
    } catch (error) {
      console.error('Error submitting contact form:', error)
      setModalSubmitStatus('error')

      setTimeout(() => {
        setModalSubmitStatus('idle')
      }, 5000)
    } finally {
      setIsModalSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with New Layout */}
      <section className="contact-hero-section-new">
        <div className="contact-hero-container-new">
          <div className="contact-hero-content-new">
            <h1 className="contact-hero-title-new">
              Need Assistance?
            </h1>

            <p className="contact-hero-text-new">
              Call us or send us a message and we’ll be happy to help you in any way we can. One of our friendly team members will get back to you within the next business day.
            </p>
            
          </div>

          <div className="contact-hero-cards">
            {/* Talk to Sales Card */}
            <div className="contact-hero-card">
              <div className="contact-hero-card-icon">
                <Phone size={48} strokeWidth={1.5} />
              </div>
              <h3 className="contact-hero-card-title">Talk to our friendly team</h3>
              <p className="contact-hero-card-description">
                Interested in our services? Just pick up the phone to chat with a member of our team.
              </p>
              <a href="tel:1300134153" className="contact-hero-phone-number">
                1300 134 153
              </a>
            </div>

            {/* Contact Customer Support Card */}
            <div className="contact-hero-card">
              <div className="contact-hero-card-icon">
                <MessageCircle size={48} strokeWidth={1.5} />
              </div>
              <h3 className="contact-hero-card-title">Contact Customer Support</h3>
              <p className="contact-hero-card-description">
                Sometimes you need a little help from your friends. Or a Remonta support rep. Don't worry... we're here for you.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="contact-hero-support-button"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Section */}
      <section className="contact-feedback-section">
        <div className="contact-section-container">
          <div className="contact-grid-container">
            {/* Left Side - Content */}
            <div className="contact-feedback-content">
              <h2 className="contact-section-title">
                Complaints, feedback, compliments?
              </h2>

              <p className="contact-section-text">
                If you would like to submit a complaint, feedback, or a compliment, please complete this form and our team will respond as soon as possible.
              </p>
            </div>

            {/* Right Side - Form */}
            <div className="contact-form-card">
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="contact-form-row">
                  <div className="contact-form-group">
                    <label className="contact-label">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`contact-input ${errors.firstName ? 'contact-input-error' : ''}`}
                    />
                    {errors.firstName && (
                      <p className="contact-error-text">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="contact-form-group">
                    <label className="contact-label">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`contact-input ${errors.lastName ? 'contact-input-error' : ''}`}
                    />
                    {errors.lastName && (
                      <p className="contact-error-text">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="contact-form-row">
                  <div className="contact-form-group">
                    <label className="contact-label">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`contact-input ${errors.email ? 'contact-input-error' : ''}`}
                    />
                    {errors.email && (
                      <p className="contact-error-text">{errors.email}</p>
                    )}
                  </div>
                  <div className="contact-form-group">
                    <label className="contact-label">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. 0412 345 678"
                      className={`contact-input ${errors.phone ? 'contact-input-error' : ''}`}
                    />
                    {errors.phone && (
                      <p className="contact-error-text">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="contact-form-group">
                  <label className="contact-label">
                    What type of feedback would you like to provide?
                  </label>
                  <div className="contact-radio-group">
                    <label className="contact-radio-label">
                      <input
                        type="radio"
                        name="feedbackType"
                        value="Complaint"
                        checked={formData.feedbackType === 'Complaint'}
                        onChange={(e) => handleRadioChange(e.target.value)}
                        className="contact-radio-input"
                      />
                      <span className="contact-radio-text">Complaint</span>
                    </label>
                    <label className="contact-radio-label">
                      <input
                        type="radio"
                        name="feedbackType"
                        value="Compliment"
                        checked={formData.feedbackType === 'Compliment'}
                        onChange={(e) => handleRadioChange(e.target.value)}
                        className="contact-radio-input"
                      />
                      <span className="contact-radio-text">Compliment</span>
                    </label>
                    <label className="contact-radio-label">
                      <input
                        type="radio"
                        name="feedbackType"
                        value="General Feedback"
                        checked={formData.feedbackType === 'General Feedback'}
                        onChange={(e) => handleRadioChange(e.target.value)}
                        className="contact-radio-input"
                      />
                      <span className="contact-radio-text">General Feedback</span>
                    </label>
                  </div>
                  {errors.feedbackType && (
                    <p className="contact-error-text">{errors.feedbackType}</p>
                  )}
                </div>

                <div className="contact-form-group">
                  <label className="contact-label">
                    Your message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className={`contact-textarea ${errors.message ? 'contact-input-error' : ''}`}
                  />
                  {errors.message && (
                    <p className="contact-error-text">{errors.message}</p>
                  )}
                </div>

                {submitStatus === 'success' && (
                  <div className="contact-success-message">
                    <div className="contact-message-container">
                      <svg className="contact-success-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h3 className="contact-success-title">Feedback submitted successfully!</h3>
                        <p className="contact-success-text">Thank you for your feedback. We'll get back to you soon.</p>
                      </div>
                    </div>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="contact-error-message">
                    <div className="contact-message-container">
                      <svg className="contact-error-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h3 className="contact-error-title">Failed to submit feedback</h3>
                        <p className="contact-error-subtext">Please try again later or contact us directly.</p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="contact-submit-button"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="contact-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

      {/* Contact Cards Section */}
      <section className="contact-cards-section">
        <div className="contact-section-container">
          <h2 className="contact-cards-title">
            Other ways to get in touch
          </h2>

          <div className="contact-cards-grid">
            <div className="contact-card">
              <div className="contact-icon-wrapper">
                <div className="contact-icon-circle">
                  <Image
                    src="/images/generalEnquiries.svg"
                    alt="General Enquiries"
                    width={64}
                    height={64}
                    className="contact-icon-image"
                  />
                </div>
              </div>
              <h3 className="contact-card-title">General Enquiries</h3>
              <p className="contact-card-description">
                For general questions, service information, or new enquiries.
              </p>
              <a
                href="mailto:contact@remontaservices.com.au"
                className="contact-email-link"
              >
                <svg className="contact-email-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span className="contact-email-text">contact@remontaservices.com.au</span>
                <svg className="contact-arrow-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            </div>

            <div className="contact-card">
              <div className="contact-icon-wrapper">
                <div className="contact-icon-circle">
                  <Image
                    src="/images/accountsBilling.svg"
                    alt="Accounts & Billing"
                    width={64}
                    height={64}
                    className="contact-icon-image"
                  />
                </div>
              </div>
              <h3 className="contact-card-title">Accounts & Billing</h3>
              <p className="contact-card-description">
                For invoices, payments, and billing enquiries.
              </p>
              <a
                href="mailto:accounts@remontaservices.com.au"
                className="contact-email-link"
              >
                <svg className="contact-email-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span className="contact-email-text">accounts@remontaservices.com.au</span>
                <svg className="contact-arrow-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            </div>

            <div className="contact-card">
              <div className="contact-icon-wrapper">
                <div className="contact-icon-circle">
                  <Image
                    src="/images/support.svg"
                    alt="Support"
                    width={64}
                    height={64}
                    className="contact-icon-image"
                  />
                </div>
              </div>
              <h3 className="contact-card-title">Support</h3>
              <p className="contact-card-description">
                For help with existing services, support worker requests, or technical assistance.
              </p>
              <a
                href="mailto:support@remontaservices.com.au"
                className="contact-email-link"
              >
                <svg className="contact-email-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span className="contact-email-text">support@remontaservices.com.au</span>
                <svg className="contact-arrow-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>

          <div className="contact-cards-grid">
            <div className="contact-card">
              <div className="contact-icon-wrapper">
                <div className="contact-icon-circle">
                  <Image
                    src="/images/compliance.svg"
                    alt="Compliance"
                    width={64}
                    height={64}
                    className="contact-icon-image"
                  />
                </div>
              </div>
              <h3 className="contact-card-title">Compliance</h3>
              <p className="contact-card-description">
                For compliance documents, verification, and policy-related enquiries.
              </p>
              <a
                href="mailto:compliance@remontaservices.com.au"
                className="contact-email-link"
              >
                <svg className="contact-email-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span className="contact-email-text">compliance@remontaservices.com.au</span>
                <svg className="contact-arrow-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            </div>

            <div className="contact-card">
              <div className="contact-icon-wrapper">
                <div className="contact-icon-circle">
                  <Image
                    src="/images/communityEngagement.svg"
                    alt="Community Engagement"
                    width={64}
                    height={64}
                    className="contact-icon-image"
                  />
                </div>
              </div>
              <h3 className="contact-card-title">Community Engagement</h3>
              <p className="contact-card-description">
                For partnerships, events, and community initiatives.
              </p>
              <a
                href="mailto:community@remontaservices.com.au"
                className="contact-email-link"
              >
                <svg className="contact-email-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span className="contact-email-text">community@remontaservices.com.au</span>
                <svg className="contact-arrow-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            </div>

            <div className="contact-card">
              <div className="contact-icon-wrapper">
                <div className="contact-icon-circle">
                  <Image
                    src="/images/recruitment.svg"
                    alt="Recruitment"
                    width={64}
                    height={64}
                    className="contact-icon-image"
                  />
                </div>
              </div>
              <h3 className="contact-card-title">Recruitment</h3>
              <p className="contact-card-description">
                For career opportunities, job applications, and employment enquiries.
              </p>
              <a
                href="mailto:recruitment@remontaservices.com.au"
                className="contact-email-link"
              >
                <svg className="contact-email-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span className="contact-email-text">recruitment@remontaservices.com.au</span>
                <svg className="contact-arrow-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {isModalOpen && (
        <div className="contact-modal-overlay">
          <div className="contact-modal-content">
            <div className="contact-modal-header">
              <div>
                <h2 className="contact-modal-title">Contact Us</h2>
                <p className="contact-modal-subtitle">Please complete the relevant form below</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="contact-close-button"
              >
                <svg className="contact-close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="contact-modal-form">
              <div>
                <select
                  name="supportType"
                  value={modalFormData.supportType}
                  onChange={handleModalInputChange}
                  className="contact-select"
                >
                  <option>Community Support</option>
                  <option>General Inquiry</option>
                  <option>Technical Support</option>
                </select>
              </div>

              <div>
                <label className="contact-modal-label">
                  Your email address
                </label>
                <input
                  type="email"
                  name="email"
                  value={modalFormData.email}
                  onChange={handleModalInputChange}
                  className={`contact-modal-input ${modalErrors.email ? 'contact-input-error' : ''}`}
                />
                {modalErrors.email && (
                  <p className="contact-error-text">{modalErrors.email}</p>
                )}
              </div>

              <div>
                <label className="contact-modal-label">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={modalFormData.firstName}
                  onChange={handleModalInputChange}
                  className={`contact-modal-input ${modalErrors.firstName ? 'contact-input-error' : ''}`}
                />
                {modalErrors.firstName && (
                  <p className="contact-error-text">{modalErrors.firstName}</p>
                )}
              </div>

              <div>
                <label className="contact-modal-label">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={modalFormData.lastName}
                  onChange={handleModalInputChange}
                  className={`contact-modal-input ${modalErrors.lastName ? 'contact-input-error' : ''}`}
                />
                {modalErrors.lastName && (
                  <p className="contact-error-text">{modalErrors.lastName}</p>
                )}
              </div>

              <div>
                <label className="contact-modal-label">
                  My enquiry is about:
                </label>
                <select
                  name="enquiryAbout"
                  value={modalFormData.enquiryAbout}
                  onChange={handleModalInputChange}
                  className="contact-select"
                >
                  <option value="">-</option>
                  <option>General Question</option>
                  <option>Service Inquiry</option>
                  <option>Support Request</option>
                </select>
                <p className="contact-helper-text">Choose which best suits your enquiry</p>
              </div>

              <div>
                <label className="contact-modal-label">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={modalFormData.subject}
                  onChange={handleModalInputChange}
                  className={`contact-modal-input ${modalErrors.subject ? 'contact-input-error' : ''}`}
                />
                {modalErrors.subject && (
                  <p className="contact-error-text">{modalErrors.subject}</p>
                )}
              </div>

              <div>
                <label className="contact-modal-label">
                  Description
                </label>
                <textarea
                  name="description"
                  value={modalFormData.description}
                  onChange={handleModalInputChange}
                  rows={4}
                  className={`contact-modal-textarea ${modalErrors.description ? 'contact-input-error' : ''}`}
                />
                {modalErrors.description && (
                  <p className="contact-error-text">{modalErrors.description}</p>
                )}
                <p className="contact-modal-helper-text">
                  Please enter the details of your request. A member of our support staff will respond as soon as possible.
                </p>
              </div>

              {modalSubmitStatus === 'success' && (
                <div className="contact-success-message">
                  <div className="contact-message-container">
                    <svg className="contact-success-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="contact-success-title">Message sent successfully!</h3>
                      <p className="contact-success-text">We'll respond as soon as possible.</p>
                    </div>
                  </div>
                </div>
              )}

              {modalSubmitStatus === 'error' && (
                <div className="contact-error-message">
                  <div className="contact-message-container">
                    <svg className="contact-error-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="contact-error-title">Failed to send message</h3>
                      <p className="contact-error-subtext">Please try again later.</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isModalSubmitting}
                className="contact-modal-submit-button"
              >
                {isModalSubmitting ? (
                  <>
                    <svg className="contact-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
