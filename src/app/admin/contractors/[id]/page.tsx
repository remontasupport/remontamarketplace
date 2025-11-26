'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Download, Phone, Mail, Globe, MessageSquare, Calendar, Car, MapPin, Edit3 } from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import WorkerProfilePDF from '@/components/pdf/WorkerProfilePDF'
import ImageCropModal from '@/components/modals/ImageCropModal'
import Image from 'next/image'
import { useState, useCallback } from 'react'
import './contractor-profile.css'

interface WorkerProfile {
  id: string
  firstName: string
  lastName: string
  age: number | null
  location: string | null
  experience: string | null
  introduction: string | null
  qualifications: string | null
  hasVehicle: string | null
  funFact: string | null
  hobbies: string | null
  uniqueService: string | null
  whyEnjoyWork: string | null
  additionalInfo: string | null
  photos: string[]
  languages?: string[]
  services?: string[]
}

interface ApiResponse {
  success: boolean
  data: WorkerProfile
  error?: string
}

export default function WorkerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const workerId = params.id as string

  const { data, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ['worker', workerId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/contractors/${workerId}`)
      if (!res.ok) throw new Error('Failed to fetch worker')
      return res.json()
    },
  })

  // Master edit mode state
  const [isEditMode, setIsEditMode] = useState<boolean>(false)

  // Image crop state
  const [showCropModal, setShowCropModal] = useState<boolean>(false)
  const [croppedImageUrl, setCroppedImageUrl] = useState<string>('')

  // Editable fields state (not saved to database)
  const [editableLanguages, setEditableLanguages] = useState<string>('')
  const [editableExperience, setEditableExperience] = useState<string>('')
  const [editableVehicle, setEditableVehicle] = useState<string>('')
  const [editableLocation, setEditableLocation] = useState<string>('')
  const [experienceItems, setExperienceItems] = useState<string[]>([])
  const [servicesItems, setServicesItems] = useState<string[]>([])
  const [editableHobbies, setEditableHobbies] = useState<string>('')
  const [editableUniqueService, setEditableUniqueService] = useState<string>('')
  const [editableWhyEnjoy, setEditableWhyEnjoy] = useState<string>('')
  const [editableIntroduction, setEditableIntroduction] = useState<string>('')

  // Initialize experience items when data loads
  const initializeExperienceItems = () => {
    if (experienceItems.length === 0 && data?.data) {
      const items: string[] = []
      if (data.data.qualifications) {
        items.push(data.data.qualifications)
      }
      items.push(`${data.data.experience || '2 years'} of professional support work`)
      setExperienceItems(items)
    }
  }

  // Initialize services items when data loads
  const initializeServicesItems = () => {
    if (servicesItems.length === 0 && data?.data) {
      const items: string[] = data.data.services && data.data.services.length > 0
        ? data.data.services
        : [
            'Personal care and assistance',
            'Capacity Building and Independence',
            'Support clients with mobility and physical needs',
            'Emotional support and companionship',
            'Care plan implementation'
          ]
      setServicesItems(items)
    }
  }

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="profile-wrapper">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-4 text-sm text-gray-600 font-poppins">Loading worker profile...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data?.success) {
    return (
      <div className="profile-container">
        <div className="profile-wrapper">
          <div className="rounded-lg bg-red-50 p-6 border border-red-200">
            <p className="text-sm text-red-800 font-poppins">Failed to load worker profile</p>
          </div>
        </div>
      </div>
    )
  }

  const worker = data.data
  const mainPhoto = worker.photos && worker.photos.length > 0 ? worker.photos[0] : null
  const initials = `${worker.firstName?.[0] || ''}${worker.lastName?.[0] || ''}`
  const displayName = `${worker.firstName} ${worker.lastName?.[0] || ''}.`

  // Initialize editable fields when data loads
  const languages = editableLanguages || (worker.languages && worker.languages.length > 0 ? worker.languages.join(', ') : 'English')
  const experience = editableExperience || worker.experience || '2 years'
  const vehicle = editableVehicle || worker.hasVehicle || 'Yes'
  const location = editableLocation || worker.location || ''

  // Initialize experience and services items
  initializeExperienceItems()
  initializeServicesItems()

  // Functions for experience items
  const updateExperienceItem = (index: number, value: string) => {
    const newItems = [...experienceItems]
    newItems[index] = value
    setExperienceItems(newItems)
  }

  const addExperienceItem = () => {
    setExperienceItems([...experienceItems, 'New experience item'])
  }

  const removeExperienceItem = (index: number) => {
    const newItems = experienceItems.filter((_, i) => i !== index)
    setExperienceItems(newItems)
  }

  // Functions for services items
  const updateServiceItem = (index: number, value: string) => {
    const newItems = [...servicesItems]
    newItems[index] = value
    setServicesItems(newItems)
  }

  const addServiceItem = () => {
    setServicesItems([...servicesItems, 'New service'])
  }

  const removeServiceItem = (index: number) => {
    const newItems = servicesItems.filter((_, i) => i !== index)
    setServicesItems(newItems)
  }

  // Image crop handlers
  const handlePhotoDoubleClick = useCallback(() => {
    if (isEditMode && mainPhoto) {
      setShowCropModal(true)
    }
  }, [isEditMode, mainPhoto])

  const handleCropComplete = useCallback((croppedUrl: string) => {
    setCroppedImageUrl(croppedUrl)
  }, [])

  const handleCloseCropModal = useCallback(() => {
    setShowCropModal(false)
  }, [])

  // Quote values
  const hobbies = editableHobbies || worker.hobbies || ''
  const uniqueService = editableUniqueService || worker.uniqueService || ''
  const whyEnjoy = editableWhyEnjoy || worker.whyEnjoyWork || 'I feel deeply fulfilled when I see my clients happy and content after our shift—it reminds me of the positive impact I can make in their daily lives'
  const introduction = editableIntroduction || worker.introduction || 'Skilled in daily living support, community participation, and implementing trauma-informed care plans. Passionate about mentoring staff, implementing person-centered care plans, and coordinating supports that ensure client wellbeing, independence, and dignity.'

  return (
    <div className="profile-container">
      <div className="profile-wrapper">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="back-button"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Contractors
          </button>

          <div className="flex items-center gap-3">
            {/* Edit Toggle Button */}
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`edit-toggle-button ${isEditMode ? 'active' : ''}`}
            >
              <Edit3 className="w-5 h-5" />
              <span>{isEditMode ? 'Done Editing' : 'Edit Profile'}</span>
            </button>

            {/* Download PDF Button */}
            <PDFDownloadLink
              document={<WorkerProfilePDF worker={worker} />}
              fileName={`${worker.firstName}_${worker.lastName}_Profile.pdf`}
            >
              {({ loading }) => (
                <button className="download-pdf-button">
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Download PDF Profile</span>
                    </>
                  )}
                </button>
              )}
            </PDFDownloadLink>
          </div>
        </div>

        {/* CANVA-STYLE PROFILE CARD */}
        <div className="profile-card">
          {/* PHOTO TERTIARY BACKGROUND */}
          <div className="photo-background-tertiary"></div>

          {/* CIRCULAR PHOTO - Centered in Left Column */}
          <div
            className="profile-photo-circle"
            onDoubleClick={handlePhotoDoubleClick}
            style={{
              cursor: isEditMode && mainPhoto ? 'pointer' : 'default',
              transition: 'transform 0.2s'
            }}
            title={isEditMode && mainPhoto ? 'Double-click to crop image' : ''}
          >
            <div className="profile-photo-inner">
              {mainPhoto ? (
                <img
                  src={croppedImageUrl || mainPhoto}
                  alt={`${worker.firstName} ${worker.lastName}`}
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="profile-photo-placeholder">{initials}</div>
              )}
            </div>
          </div>

          <div className="profile-content">
            {/* LEFT COLUMN - Beige/Cream */}
            <div className="profile-left-column">
              {/* CONTACT SECTION */}
              <div className="contact-section">
                <h2 className="left-section-title">Contact</h2>
                <div className="contact-item">
                  <Phone className="w-4 h-4" />
                  <span>1300-134-153</span>
                </div>
                <div className="contact-item">
                  <Mail className="w-4 h-4" />
                  <span>contact@remontaservices.com.au</span>
                </div>
                <div className="contact-item">
                  <Globe className="w-4 h-4" />
                  <span>www.remontaservice.com.au</span>
                </div>
              </div>

              {/* ABOUT ME SECTION */}
              <div className="about-section">
                <h2 className="left-section-title">About Me</h2>

                <div className="about-item">
                  <div className="about-label">
                    <MessageSquare className="w-4 h-4" />
                    Language
                  </div>
                  <div className="about-value">
                    • <span
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                        onFocus={(e) => {
                          const range = document.createRange()
                          range.selectNodeContents(e.currentTarget)
                          const selection = window.getSelection()
                          selection?.removeAllRanges()
                          selection?.addRange(range)
                        }}
                        onBlur={(e) => setEditableLanguages(e.currentTarget.textContent || '')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            e.currentTarget.blur()
                          }
                        }}
                        className="editable-field"
                      >
                        {languages}
                      </span>
                  </div>
                </div>

                <div className="about-item">
                  <div className="about-label">
                    <Calendar className="w-4 h-4" />
                    Years of Experience
                  </div>
                  <div className="about-value">
                    • <span
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                        onFocus={(e) => {
                          const range = document.createRange()
                          range.selectNodeContents(e.currentTarget)
                          const selection = window.getSelection()
                          selection?.removeAllRanges()
                          selection?.addRange(range)
                        }}
                        onBlur={(e) => setEditableExperience(e.currentTarget.textContent || '')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            e.currentTarget.blur()
                          }
                        }}
                        className="editable-field"
                      >
                        {experience}
                      </span>
                  </div>
                </div>

                <div className="about-item">
                  <div className="about-label">
                    <Car className="w-4 h-4" />
                    Drive Access
                  </div>
                  <div className="about-value">
                    • <span
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                        onFocus={(e) => {
                          const range = document.createRange()
                          range.selectNodeContents(e.currentTarget)
                          const selection = window.getSelection()
                          selection?.removeAllRanges()
                          selection?.addRange(range)
                        }}
                        onBlur={(e) => setEditableVehicle(e.currentTarget.textContent || '')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            e.currentTarget.blur()
                          }
                        }}
                        className="editable-field"
                      >
                        {vehicle}
                      </span>
                  </div>
                </div>

                {(location || worker.location) && (
                  <div className="about-item">
                    <div className="about-label">
                      <MapPin className="w-4 h-4" />
                      Location
                    </div>
                    <div className="about-value">
                      • <span
                          contentEditable={isEditMode}
                          suppressContentEditableWarning
                          onFocus={(e) => {
                            const range = document.createRange()
                            range.selectNodeContents(e.currentTarget)
                            const selection = window.getSelection()
                            selection?.removeAllRanges()
                            selection?.addRange(range)
                          }}
                          onBlur={(e) => setEditableLocation(e.currentTarget.textContent || '')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              e.currentTarget.blur()
                            }
                          }}
                          className="editable-field"
                        >
                          {location}
                        </span>
                    </div>
                  </div>
                )}
              </div>

              {/* EXPERIENCE SECTION */}
              <div className="experience-section">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="left-section-title">Experience</h2>
                  {isEditMode && (
                    <button
                      onClick={addExperienceItem}
                      className="add-experience-btn"
                      title="Add experience item"
                    >
                      + Add
                    </button>
                  )}
                </div>

                {experienceItems.map((item, index) => (
                  <div key={index} className="experience-item">
                    <div className="experience-dot"></div>
                    <div className="experience-text">
                      <span
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                        onFocus={(e) => {
                          const range = document.createRange()
                          range.selectNodeContents(e.currentTarget)
                          const selection = window.getSelection()
                          selection?.removeAllRanges()
                          selection?.addRange(range)
                        }}
                        onBlur={(e) => updateExperienceItem(index, e.currentTarget.textContent || '')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            e.currentTarget.blur()
                          }
                        }}
                        className="editable-field"
                      >
                        {item}
                      </span>
                      {isEditMode && experienceItems.length > 1 && (
                        <button
                          onClick={() => removeExperienceItem(index)}
                          className="remove-item-btn"
                          title="Remove this item"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN - Dark Navy */}
            <div className="profile-right-column">
              {/* REMONTA LOGO */}
              <div className="remonta-logo">
                <Image
                  src="/logo/logo-dark.svg"
                  alt="Remonta"
                  width={150}
                  height={40}
                  priority
                />
              </div>

              {/* NAME & BIO SECTION - Tertiary Background */}
              <div className="worker-header-tertiary">
                {/* WORKER NAME & TITLE */}
                <div className="worker-header">
                  <h1 className="worker-name">
                    {displayName}
                  </h1>
                  <div className="worker-title">Support Worker</div>
                </div>

                {/* BIO / INTRODUCTION */}
                <p className="worker-bio">
                  <span
                    contentEditable={isEditMode}
                    suppressContentEditableWarning
                    onFocus={(e) => {
                      const range = document.createRange()
                      range.selectNodeContents(e.currentTarget)
                      const selection = window.getSelection()
                      selection?.removeAllRanges()
                      selection?.addRange(range)
                    }}
                    onBlur={(e) => setEditableIntroduction(e.currentTarget.textContent || '')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        e.currentTarget.blur()
                      }
                    }}
                    className="editable-field"
                  >
                    {introduction}
                  </span>
                </p>
              </div>

              {/* SERVICES SECTION */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="right-section-title">Services</h2>
                  {isEditMode && (
                    <button
                      onClick={addServiceItem}
                      className="add-service-btn"
                      title="Add service"
                    >
                      + Add
                    </button>
                  )}
                </div>
                <div className="services-list">
                  {servicesItems.map((service, index) => (
                    <div key={index} className="service-item">
                      <div className="service-bullet"></div>
                      <div className="service-text">
                        <span
                          contentEditable={isEditMode}
                          suppressContentEditableWarning
                          onFocus={(e) => {
                            const range = document.createRange()
                            range.selectNodeContents(e.currentTarget)
                            const selection = window.getSelection()
                            selection?.removeAllRanges()
                            selection?.addRange(range)
                          }}
                          onBlur={(e) => updateServiceItem(index, e.currentTarget.textContent || '')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              e.currentTarget.blur()
                            }
                          }}
                          className="editable-field editable-field-white"
                        >
                          {service}
                        </span>
                        {isEditMode && servicesItems.length > 1 && (
                          <button
                            onClick={() => removeServiceItem(index)}
                            className="remove-item-btn remove-item-btn-white"
                            title="Remove this service"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* HOBBIES */}
              {hobbies && (
                <div className="quote-section">
                  <h3 className="quote-title">Hobbies</h3>
                  <p className="quote-text">
                    "<span
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                      onFocus={(e) => {
                        const range = document.createRange()
                        range.selectNodeContents(e.currentTarget)
                        const selection = window.getSelection()
                        selection?.removeAllRanges()
                        selection?.addRange(range)
                      }}
                      onBlur={(e) => setEditableHobbies(e.currentTarget.textContent || '')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          e.currentTarget.blur()
                        }
                      }}
                      className="editable-field editable-field-white"
                    >
                      {hobbies}
                    </span>"
                  </p>
                </div>
              )}

              {/* WHAT MAKES YOUR SERVICES UNIQUE */}
              {uniqueService && (
                <div className="quote-section">
                  <h3 className="quote-title">What makes your services unique?</h3>
                  <p className="quote-text">
                    "<span
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                      onFocus={(e) => {
                        const range = document.createRange()
                        range.selectNodeContents(e.currentTarget)
                        const selection = window.getSelection()
                        selection?.removeAllRanges()
                        selection?.addRange(range)
                      }}
                      onBlur={(e) => setEditableUniqueService(e.currentTarget.textContent || '')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          e.currentTarget.blur()
                        }
                      }}
                      className="editable-field editable-field-white"
                    >
                      {uniqueService}
                    </span>"
                  </p>
                </div>
              )}

              {/* WHY DO YOU ENJOY YOUR WORK */}
              <div className="quote-section">
                <h3 className="quote-title">Why do you enjoy your work?</h3>
                <p className="quote-text">
                  "<span
                    contentEditable={isEditMode}
                    suppressContentEditableWarning
                    onFocus={(e) => {
                      const range = document.createRange()
                      range.selectNodeContents(e.currentTarget)
                      const selection = window.getSelection()
                      selection?.removeAllRanges()
                      selection?.addRange(range)
                    }}
                    onBlur={(e) => setEditableWhyEnjoy(e.currentTarget.textContent || '')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        e.currentTarget.blur()
                      }
                    }}
                    className="editable-field editable-field-white"
                  >
                    {whyEnjoy}
                  </span>"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Image Crop Modal */}
        {showCropModal && mainPhoto && (
          <ImageCropModal
            imageUrl={mainPhoto}
            onClose={handleCloseCropModal}
            onCropComplete={handleCropComplete}
          />
        )}
      </div>
    </div>
  )
}
