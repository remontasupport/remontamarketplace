'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Download, Phone, Mail, Globe, MessageSquare, Calendar, Car, MapPin, Edit3, Upload } from 'lucide-react'
import ImageCropModal from '@/components/modals/ImageCropModal'
import ServiceSelectionModal from '@/components/modals/ServiceSelectionModal'
import NextImage from 'next/image'
import { useState, useCallback, useEffect } from 'react'
import './contractor-profile.css'

interface WorkerProfile {
  id: string
  firstName: string
  lastName: string
  location: string | null
  languages?: string[]
  services?: string[]
  photos?: string | null
  experience?: string | null
  hasVehicle?: string | null
  introduction?: string | null
  hobbies?: string | null
  uniqueService?: string | null
  qualifications?: string | null
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
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('')

  // Service selection modal state
  const [showServiceModal, setShowServiceModal] = useState<boolean>(false)

  // Editable fields state (not saved to database)
  const [editableLanguages, setEditableLanguages] = useState<string>('')
  const [editableExperience, setEditableExperience] = useState<string>('')
  const [editableVehicle, setEditableVehicle] = useState<string>('')
  const [editableLocation, setEditableLocation] = useState<string>('')
  const [editableIntroduction, setEditableIntroduction] = useState<string>('')
  const [editableHobbies, setEditableHobbies] = useState<string>('')
  const [editableUniqueService, setEditableUniqueService] = useState<string>('')
  const [editableWhyEnjoy, setEditableWhyEnjoy] = useState<string>('')
  const [experienceItems, setExperienceItems] = useState<string[]>([])
  const [servicesItems, setServicesItems] = useState<string[]>([])

  // Initialize experience and services items when data loads
  useEffect(() => {
    if (data?.data && experienceItems.length === 0) {
      const items: string[] = []
      if (data.data.qualifications) {
        items.push(data.data.qualifications)
      }
      items.push(`${data.data.experience || '2 years'} of professional support work`)
      setExperienceItems(items)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.data])

  useEffect(() => {
    if (data?.data && servicesItems.length === 0) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.data])

  // Image crop handlers (must be before early returns)
  const handlePhotoDoubleClick = useCallback(() => {
    const currentPhoto = selectedImageUrl || data?.data?.photos?.[0]
    if (isEditMode && currentPhoto) {
      setShowCropModal(true)
    }
  }, [isEditMode, selectedImageUrl, data?.data?.photos])

  const handleCropComplete = useCallback((croppedUrl: string) => {
    setCroppedImageUrl(croppedUrl)
  }, [])

  const handleCloseCropModal = useCallback(() => {
    setShowCropModal(false)
  }, [])

  // Handle JPEG download - optimized client-side generation
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false)
  const handleDownloadPDF = useCallback(async () => {
    try {
      setIsDownloadingPDF(true)

      // Wait a bit for any pending renders
      await new Promise(resolve => setTimeout(resolve, 100))

      // Dynamically import library
      const { toJpeg } = await import('html-to-image')

      // Get the profile card element
      const element = document.querySelector('.profile-card') as HTMLElement
      if (!element) {
        throw new Error('Profile card not found')
      }

      // Temporarily hide the "Change Photo" button for download
      const changePhotoOverlay = document.querySelector('.photo-change-overlay') as HTMLElement
      const originalDisplay = changePhotoOverlay?.style.display
      if (changePhotoOverlay) {
        changePhotoOverlay.style.display = 'none'
      }

      // Store original styles
      const originalBoxShadow = element.style.boxShadow
      const originalBorderRadius = element.style.borderRadius
      const originalBackground = element.style.background

      // Remove visual effects for cleaner image
      element.style.boxShadow = 'none'
      element.style.borderRadius = '0'
      // Override the card's white background with the actual column colors so any
      // gap at the very top (html-to-image rendering quirk) shows the correct colors
      // instead of white. Left 35% = blue-gray, right 65% = dark navy.
      element.style.background = 'linear-gradient(to right, #B1C3CD 35%, #0C1628 35%)'

      // Scroll element into view for accurate capture
      element.scrollIntoView({ block: 'start', behavior: 'instant' })
      await new Promise(resolve => setTimeout(resolve, 100))

      // Explicitly set heights so columns fill the full card (fixes white-space issue
      // when parent uses aspect-ratio instead of a definite height)
      const cardHeight = element.offsetHeight
      const contentEl = element.querySelector('.profile-content') as HTMLElement
      const leftCol = element.querySelector('.profile-left-column') as HTMLElement
      const rightCol = element.querySelector('.profile-right-column') as HTMLElement

      const prevContentH = contentEl?.style.height ?? ''
      const prevLeftH = leftCol?.style.height ?? ''
      const prevRightH = rightCol?.style.height ?? ''

      if (contentEl) contentEl.style.height = `${cardHeight}px`
      if (leftCol) leftCol.style.height = `${cardHeight}px`
      if (rightCol) rightCol.style.height = `${cardHeight}px`

      // Generate JPEG from HTML with high quality
      const dataUrl = await toJpeg(element, {
        quality: 0.95,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
      })

      // Restore heights
      if (contentEl) contentEl.style.height = prevContentH
      if (leftCol) leftCol.style.height = prevLeftH
      if (rightCol) rightCol.style.height = prevRightH

      // Restore original styles
      element.style.boxShadow = originalBoxShadow
      element.style.borderRadius = originalBorderRadius
      element.style.background = originalBackground
      if (changePhotoOverlay) {
        changePhotoOverlay.style.display = originalDisplay || ''
      }

      // Download JPEG
      const fileName = `${data?.data?.firstName}_${data?.data?.lastName}_Profile.jpeg`
      const link = document.createElement('a')
      link.download = fileName
      link.href = dataUrl
      link.click()

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to generate image: ${errorMsg}\n\nPlease check the console for details.`)
    } finally {
      setIsDownloadingPDF(false)
    }
  }, [data?.data?.firstName, data?.data?.lastName])

  // Handle image file selection
  const handleImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file')
      return
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB in bytes
    if (file.size > maxSize) {
      alert('Image size must be less than 50MB')
      return
    }

    // Read and preview the file
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      setSelectedImageUrl(imageUrl)
      setCroppedImageUrl('') // Reset cropped image when new image is selected
    }
    reader.onerror = () => {
      alert('Failed to read image file')
    }
    reader.readAsDataURL(file)

    // Reset the input so the same file can be selected again
    event.target.value = ''
  }, [])

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
  // photos is now a string (single photo URL), not an array
  const mainPhoto = worker.photos || null
  const initials = `${worker.firstName?.[0] || ''}${worker.lastName?.[0] || ''}`
  const displayName = `${worker.firstName} ${worker.lastName?.[0] || ''}.`

  // Initialize editable fields when data loads
  const languages = editableLanguages || (worker.languages && worker.languages.length > 0 ? worker.languages.join(', ') : 'English')
  const rawExperience = editableExperience || worker.experience || '2'
  const experience = rawExperience.toLowerCase().includes('year')
    ? rawExperience
    : `${rawExperience} ${rawExperience === '1' ? 'year' : 'years'}`
  const vehicle = editableVehicle || worker.hasVehicle || 'Yes'
  const location = editableLocation || worker.location || ''
  const introduction = editableIntroduction || worker.introduction || 'Dedicated support worker committed to providing compassionate care and assistance to individuals with diverse needs.'
  const hobbies = editableHobbies || worker.hobbies || ''
  const uniqueService = editableUniqueService || worker.uniqueService || ''
  const whyEnjoy = editableWhyEnjoy || 'I find great fulfillment in making a positive impact on people\'s lives and helping them achieve their goals.'

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
    setShowServiceModal(true)
  }

  const handleSelectService = (service: string) => {
    setServicesItems([...servicesItems, service])
  }

  const removeServiceItem = (index: number) => {
    const newItems = servicesItems.filter((_, i) => i !== index)
    setServicesItems(newItems)
  }


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
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloadingPDF}
              className="download-pdf-button"
            >
              {isDownloadingPDF ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                  <span>Generating JPEG...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Download JPEG Profile</span>
                </>
              )}
            </button>
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
              cursor: isEditMode && (selectedImageUrl || mainPhoto) ? 'pointer' : 'default',
              transition: 'transform 0.2s'
            }}
            title={isEditMode && (selectedImageUrl || mainPhoto) ? 'Double-click to crop image' : ''}
          >
            <div className="profile-photo-inner">
              {(selectedImageUrl || croppedImageUrl || mainPhoto) ? (
                <img
                  src={croppedImageUrl || selectedImageUrl || mainPhoto || ''}
                  alt={`${worker.firstName} ${worker.lastName}`}
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="profile-photo-placeholder">{initials}</div>
              )}
            </div>

            {/* Change Photo Button - Only visible in edit mode */}
            {isEditMode && (
              <div className="photo-change-overlay">
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  aria-label="Upload new photo"
                />
                <label htmlFor="photo-upload" className="photo-change-button">
                  <Upload className="w-4 h-4" />
                  <span>Change Photo</span>
                </label>
              </div>
            )}
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

                {(vehicle && vehicle.toLowerCase() !== 'no' && vehicle.toLowerCase() !== 'false') && (
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
                )}

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
                <NextImage
                  src="/logo/logo-dark.svg"
                  alt="Remonta"
                  width={180}
                  height={48}
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
                    {hobbies || 'Placeholder'}
                  </span>"
                </p>
              </div>

              {/* WHAT MAKES YOUR SERVICES UNIQUE */}
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
                    {uniqueService || 'Placeholder'}
                  </span>"
                </p>
              </div>

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
        {showCropModal && (selectedImageUrl || mainPhoto) && (
          <ImageCropModal
            imageUrl={selectedImageUrl || mainPhoto || ''}
            onClose={handleCloseCropModal}
            onCropComplete={handleCropComplete}
          />
        )}

        {/* Service Selection Modal */}
        {showServiceModal && (
          <ServiceSelectionModal
            onClose={() => setShowServiceModal(false)}
            onSelectService={handleSelectService}
          />
        )}
      </div>
    </div>
  )
}
