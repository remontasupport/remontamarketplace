"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Eye, ChevronUp, Users } from "lucide-react";
import { useProfilePreview } from "@/hooks/useProfilePreview";
import { getQualificationDisplayName, QUALIFICATION_TYPE_TO_NAME } from "@/utils/qualificationMapping";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import QueryProvider from "@/providers/QueryProvider";
import Loader from "@/components/ui/Loader";
import ImageCropModal from "@/components/modals/ImageCropModal";
import { blobUrlToFile } from "@/utils/imageCrop";
import { updateWorkerPhoto } from "@/services/worker/profile.service";
import "@/app/styles/profile-preview.css";

function ProfilePreviewContent() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: profileData, isLoading, error, refetch } = useProfilePreview();

  // Photo upload state
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Service category expansion state
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});

  // Toggle service category expansion
  const toggleServiceExpansion = (categoryId: string) => {
    setExpandedServices(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Handle photo file selection
  const handlePhotoClick = () => {
    document.getElementById('photo-upload-input')?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
      alert("Only JPG, PNG, and WebP formats are allowed");
      return;
    }

    // Validate file size (10MB)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      alert("File size must be less than 10MB");
      return;
    }

    // Store file and create preview URL
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setSelectedImageUrl(objectUrl);
    setShowCropModal(true);

    // Reset input
    event.target.value = '';
  };

  // Handle crop completion
  const handleCropComplete = async (croppedImageUrl: string) => {
    setShowCropModal(false);

    try {
      setIsUploading(true);
      const croppedFile = await blobUrlToFile(croppedImageUrl, selectedFile?.name || 'cropped-photo.jpg');

      // Upload to API
      const formData = new FormData();
      formData.append("photo", croppedFile);
      formData.append("email", session?.user?.email || "user");

      const response = await fetch("/api/upload/worker-photo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }

      const data = await response.json();

      if (data.url) {
        // Save photo URL to database using server action
        const result = await updateWorkerPhoto({ photo: data.url });

        if (!result.success) {
          throw new Error(result.error || "Failed to save photo to database");
        }

        // Refetch profile data to update the photo
        window.location.reload();
      } else {
        throw new Error("No URL returned from upload");
      }
    } catch (error: any) {
     
      alert(`Failed to upload photo: ${error.message}`);
    } finally {
      setIsUploading(false);
      // Clean up blob URLs
      if (selectedImageUrl) {
        URL.revokeObjectURL(selectedImageUrl);
      }
      setSelectedImageUrl("");
      setSelectedFile(null);
    }
  };

  // Handle crop modal close
  const handleCloseCropModal = () => {
    setShowCropModal(false);
    // Clean up blob URL
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl);
    }
    setSelectedImageUrl("");
    setSelectedFile(null);
  };

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout showProfileCard={false}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (error || !profileData) {
    return (
      <DashboardLayout showProfileCard={false}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <p className="text-red-600">Failed to load profile data</p>
        </div>
      </DashboardLayout>
    );
  }

  const { profile, services, qualifications, additionalInfo } = profileData;

  // Filter qualifications to only show those in QUALIFICATION_TYPE_TO_NAME mapping
  const validQualifications = qualifications?.filter(qual =>
    QUALIFICATION_TYPE_TO_NAME.hasOwnProperty(qual.requirementType)
  ) || [];

  // Flatten all subcategories from worker_services
  const allSubcategories = services?.flatMap(service =>
    service.subcategories.map(sub => sub.subcategoryName)
  ) || [];

  // Compute years of experience from jobHistory
  const computeYearsOfExperience = () => {
    if (!additionalInfo?.jobHistory) {
      return [];
    }

    const jobHistory = Array.isArray(additionalInfo.jobHistory)
      ? additionalInfo.jobHistory
      : [];

    // Map month names to numbers
    const monthMap: { [key: string]: number } = {
      'January': 0, 'February': 1, 'March': 2, 'April': 3,
      'May': 4, 'June': 5, 'July': 6, 'August': 7,
      'September': 8, 'October': 9, 'November': 10, 'December': 11
    };

    return jobHistory.map((job: any) => {
      // jobHistory uses startYear, startMonth, endYear, endMonth fields
      const startYear = job.startYear ? parseInt(job.startYear) : null;
      const startMonth = job.startMonth ? monthMap[job.startMonth] : 0;
      const endYear = job.endYear ? parseInt(job.endYear) : null;
      const endMonth = job.endMonth ? monthMap[job.endMonth] : 11;

      if (!startYear) return null;

      // Create start date
      const startDate = new Date(startYear, startMonth || 0, 1);

      // Create end date (or use current date if no end date)
      const endDate = endYear
        ? new Date(endYear, endMonth || 11, 1)
        : new Date();

      // Calculate years of experience
      const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      const roundedYears = Math.max(0, Math.round(years * 10) / 10);

      return {
        jobTitle: job.jobTitle || 'Position',
        company: job.economy || job.company || '',
        years: roundedYears,
      };
    }).filter(Boolean);
  };

  const yearsOfExperience = computeYearsOfExperience();

  // Generate initials
  const initials = profile?.firstName && profile?.lastName
    ? `${profile.firstName[0]}${profile.lastName[0]}`
    : "U";

  // Format registration date
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-AU", { month: "long", year: "numeric" })
    : "Recently";

  // Format services separated by slashes
  const servicesText = services && services.length > 0
    ? services.map(service => service.categoryName).join(" / ")
    : "Support Worker";

  return (
    <DashboardLayout showProfileCard={false}>
      <div className="profile-preview-page">
        {/* Back Button */}
        <div className="profile-preview-back-section">
          <button className="profile-preview-back-button" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
            <span>Edit my profile</span>
          </button>
        </div>

        {/* Top Banner */}
        <div className="profile-preview-banner">
          <div className="profile-preview-banner-content">
            <Eye className="w-5 h-5" />
            <span>Your profile isn't visible to clients until your account is approved</span>
          </div>
        </div>

        {/* Profile Header */}
        <div className="profile-preview-header">
          <div className="profile-preview-header-content">
            {/* Avatar */}
            <div className="profile-preview-avatar">
              {profile?.photos ? (
                <img src={profile.photos} alt={`${profile.firstName} ${profile.lastName}`} />
              ) : (
                <div className="profile-preview-avatar-placeholder">
                  {initials}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="profile-preview-info">
              <h1 className="profile-preview-name">
                {profile.firstName} {profile.lastName?.[0]}.
              </h1>
              <p className="profile-preview-roles">
                {servicesText}
              </p>

              <button
                className="profile-preview-photo-link"
                onClick={handlePhotoClick}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Update profile photo'}
              </button>

              {/* Hidden file input */}
              <input
                id="photo-upload-input"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="profile-preview-content">
          {/* About Section */}
          <div className="profile-preview-section">
            <h2 className="profile-preview-section-title">
              {profile.firstName} {profile.lastName?.[0]}.
            </h2>
            <button
              className="profile-preview-edit-link"
              onClick={() => router.push('/dashboard/worker/account/setup?step=bio')}
            >
              Edit bio
            </button>
            {profile.introduction ? (
              <p className="profile-preview-text">{profile.introduction}</p>
            ) : (
              <p className="profile-preview-text text-gray-400 italic">
                No introduction provided yet. Click "Edit bio" to add your introduction.
              </p>
            )}
          </div>

          {/* Two Column Layout */}
          <div className="profile-preview-grid">
            {/* Left Column */}
            <div className="profile-preview-column">
              {/* About Me Section */}
              <div className="profile-preview-section">
                <h3 className="profile-preview-subsection-title">About Me</h3>

                {/* Drive Access */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-400">🚗</span>
                    <h4 className="text-base font-poppins font-semibold text-gray-700">Drive Access</h4>
                  </div>
                  <p className="text-base text-gray-900 ml-7">
                    {profile?.hasVehicle ? 'Yes' : 'No'}
                  </p>
                </div>

                {/* Location */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-400">📍</span>
                    <h4 className="text-base font-poppins font-semibold text-gray-700">Location</h4>
                  </div>
                  <p className="text-base text-gray-900 ml-7">
                    {profile?.location || 'Not specified'}
                  </p>
                </div>
              </div>

              {/* Experience */}
              {additionalInfo?.experience && typeof additionalInfo.experience === 'object' && Object.keys(additionalInfo.experience).length > 0 && (
                <div className="profile-preview-section">
                  <h3 className="profile-preview-subsection-title">Experience</h3>
                  <p className="text-sm text-gray-500 mb-4">Self declared</p>

                  {/* Experience Categories */}
                  <div className="space-y-4">
                    {Object.entries(additionalInfo.experience).map(([categoryId, experienceData]: [string, any]) => {
                      // Find the category name from services
                      const categoryService = services?.find(s => s.categoryId === categoryId);
                      const rawCategoryName = categoryService?.categoryName || categoryId;

                      // Capitalize first letter of category name
                      const categoryName = rawCategoryName.charAt(0).toUpperCase() + rawCategoryName.slice(1);

                      // Skip if experienceData is not valid
                      if (!experienceData || typeof experienceData !== 'object') {
                        return null;
                      }

                      const description = experienceData.description || '';
                      const specificAreas = experienceData.specificAreas || [];
                      const otherAreas = experienceData.otherAreas || [];
                      const allAreas = [...specificAreas, ...otherAreas].filter(Boolean);

                      // Skip if no description
                      if (!description) {
                        return null;
                      }

                      return (
                        <div key={categoryId} className="border border-gray-200 rounded-lg overflow-hidden" style={{ width: '100%', maxWidth: '100%' }}>
                          {/* Category Header */}
                          <div
                            className="flex items-center justify-between cursor-pointer p-4"
                            onClick={() => toggleServiceExpansion(categoryId)}
                          >
                            <h4 className="text-base font-poppins font-semibold text-gray-900">
                              {categoryName}
                            </h4>
                            <ChevronUp
                              className={`w-5 h-5 text-gray-600 transition-transform flex-shrink-0 ${
                                expandedServices[categoryId] ? 'rotate-180' : ''
                              }`}
                            />
                          </div>

                          {/* Expanded Content */}
                          {expandedServices[categoryId] && (
                            <div className="px-4 pb-4 border-t border-gray-200 pt-4" style={{ maxWidth: '100%' }}>
                              <div className="flex items-center gap-2 mb-3">
                                <Users className="w-5 h-5 text-gray-600" />
                                <h5 className="text-base font-poppins font-semibold text-gray-700">
                                  Professional Experience
                                </h5>
                              </div>
                              <p
                                className="text-base text-gray-700 leading-relaxed mb-4"
                                style={{
                                  wordWrap: 'break-word',
                                  overflowWrap: 'break-word',
                                  wordBreak: 'break-word',
                                  whiteSpace: 'normal',
                                  maxWidth: '100%'
                                }}
                              >
                                {description}
                              </p>

                              {/* Knows About */}
                              {allAreas.length > 0 && (
                                <div>
                                  <p className="text-base text-gray-900">
                                    <span className="font-semibold">Knows about: </span>
                                    {allAreas.join(', ')}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Job History */}
              {yearsOfExperience.length > 0 && (
                <div className="profile-preview-section">
                  <h3 className="profile-preview-subsection-title">Job History</h3>
                  <div className="space-y-2">
                    {yearsOfExperience.map((job: any, index: number) => (
                      <div key={index} className="profile-preview-qualification-item">
                        <span className="profile-preview-checkmark" style={{ fontSize: '24px' }}>•</span>
                        <span className="text-base text-gray-900">
                          {job.jobTitle && `${job.jobTitle}`}
                          {job.company && ` at ${job.company}`}
                          {` - ${Math.round(job.years)} ${Math.round(job.years) === 1 ? 'year' : 'years'}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education History */}
              <div className="profile-preview-section">
                <h3 className="profile-preview-subsection-title">Education History</h3>
                {additionalInfo?.education && Array.isArray(additionalInfo.education) && additionalInfo.education.length > 0 ? (
                  <div className="space-y-4">
                    {additionalInfo.education.map((edu: any, index: number) => (
                      <div key={index} className="mb-4">
                        {(edu.degree || edu.qualification) && (
                          <p className="text-base font-poppins font-semibold text-gray-900">
                            {edu.degree || edu.qualification}
                          </p>
                        )}
                        {edu.institution && (
                          <p className="text-base text-gray-700">
                            {edu.institution}
                          </p>
                        )}
                        {edu.startYear && edu.endYear && (
                          <p className="text-base text-gray-700">
                            {edu.startMonth && edu.startYear ? `${edu.startMonth}/${edu.startYear}` : edu.startYear} - {edu.endMonth && edu.endYear ? `${edu.endMonth}/${edu.endYear}` : edu.endYear}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="profile-preview-text text-gray-400 italic">
                    No education history added yet.
                  </p>
                )}
              </div>

              {/* More Information */}
              <div className="profile-preview-section">
                <h3 className="profile-preview-subsection-title">More information</h3>
                <p className="text-sm text-gray-500 mb-4">Self declared</p>

                {/* Language */}
                {additionalInfo?.languages && Array.isArray(additionalInfo.languages) && additionalInfo.languages.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-base font-poppins font-semibold text-gray-700 mb-2">Language</h4>
                    <div className="flex flex-wrap gap-2">
                      {additionalInfo.languages.map((lang: string, index: number) => (
                        <span key={index} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-base">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cultural backgrounds */}
                {additionalInfo?.culturalBackground && additionalInfo.culturalBackground.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-base font-poppins font-semibold text-gray-700 mb-2">Cultural backgrounds</h4>
                    <div className="flex flex-wrap gap-2">
                      {additionalInfo.culturalBackground.map((culture: string, index: number) => (
                        <span key={index} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-base">
                          {culture}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Religion */}
                {additionalInfo?.religion && Array.isArray(additionalInfo.religion) && additionalInfo.religion.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-base font-poppins font-semibold text-gray-700 mb-2">Religion</h4>
                    <div className="flex flex-wrap gap-2">
                      {additionalInfo.religion.map((rel: string, index: number) => (
                        <span key={index} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-base">
                          {rel}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interests */}
                {additionalInfo?.interests && additionalInfo.interests.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-base font-poppins font-semibold text-gray-700 mb-2">Interests</h4>
                    <div className="flex flex-wrap gap-2">
                      {additionalInfo.interests.map((interest: string, index: number) => (
                        <span key={index} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-base">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Personality */}
                {additionalInfo?.personality && (
                  <div className="mb-4">
                    <h4 className="text-base font-poppins font-semibold text-gray-700 mb-2">Personality</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-base">
                        {additionalInfo.personality}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="profile-preview-column">
              {/* Qualifications - Only show if there are qualifications */}
              {validQualifications.length > 0 && (
                <div className="profile-preview-section">
                  <h3 className="profile-preview-subsection-title">Qualifications</h3>
                  <p className="profile-preview-verified">Verified by Remonta</p>
                  <div className="profile-preview-qualification-list">
                    {validQualifications.map((qual) => (
                      <div key={qual.requirementType} className="profile-preview-qualification-item">
                        <span className="profile-preview-checkmark" style={{ fontSize: '24px' }}>•</span>
                        <span>{getQualificationDisplayName(qual.requirementType, qual.requirementName)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services Offered */}
              <div className="profile-preview-section">
                <h3 className="profile-preview-subsection-title">Services offered</h3>
                {allSubcategories.length > 0 ? (
                  <div className="profile-preview-qualification-list">
                    {allSubcategories.map((subcategoryName, index) => (
                      <div key={index} className="profile-preview-qualification-item">
                        <span className="profile-preview-checkmark" style={{ fontSize: '24px' }}>•</span>
                        <span>{subcategoryName}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="profile-preview-text text-gray-400 italic">
                    No services added yet. Add services in the services setup.
                  </p>
                )}
              </div>

              {/* Unique Service */}
              {additionalInfo?.uniqueService && (
                <div className="profile-preview-section">
                  <h3 className="profile-preview-subsection-title">Unique Service</h3>
                  <p className="profile-preview-text">{additionalInfo.uniqueService}</p>
                </div>
              )}

              {/* Fun Fact */}
              {additionalInfo?.funFact && (
                <div className="profile-preview-section">
                  <h3 className="profile-preview-subsection-title">Fun Fact</h3>
                  <p className="profile-preview-text">{additionalInfo.funFact}</p>
                </div>
              )}

              {/* Working Hours */}
              {additionalInfo?.availability && Object.keys(additionalInfo.availability).length > 0 && (
                <div className="profile-preview-section">
                  <h3 className="profile-preview-subsection-title">Working Hours</h3>
                  <div className="space-y-4">
                    {Object.entries(additionalInfo.availability as Record<string, { startTime: string; endTime: string } | Array<{ startTime: string; endTime: string }>>).map(([day, timeSlots]) => {
                      // Format day name (MONDAY -> Monday)
                      const dayName = day.charAt(0) + day.slice(1).toLowerCase();

                      // Format times (24hr to 12hr)
                      const formatTime = (time: string) => {
                        const [hours, minutes] = time.split(':');
                        const hour = parseInt(hours);
                        const ampm = hour >= 12 ? 'pm' : 'am';
                        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                        return `${displayHour}${minutes !== '00' ? ':' + minutes : ''}${ampm}`;
                      };

                      // Handle both single object and array of objects
                      const slotsArray = Array.isArray(timeSlots) ? timeSlots : [timeSlots];

                      return (
                        <div key={day}>
                          <h4 className="text-base font-poppins font-semibold text-gray-900 mb-2">
                            {dayName}
                          </h4>
                          <div className="flex flex-wrap items-center gap-4">
                            {slotsArray.map((slot, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <span className="text-green-600 text-lg">✓</span>
                                <span className="text-base text-gray-700">
                                  {formatTime(slot.startTime)}-{formatTime(slot.endTime)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Good to Know */}
              {(additionalInfo?.lgbtqiaSupport || additionalInfo?.nonSmoker || additionalInfo?.petFriendly) && (
                <div className="profile-preview-section">
                  <h3 className="profile-preview-subsection-title">Good to know</h3>
                  <div className="flex flex-wrap gap-4">
                    {additionalInfo.lgbtqiaSupport && (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                          <span className="text-2xl">🏳️‍🌈</span>
                        </div>
                        <p className="text-sm text-gray-700 text-center">LGBTQIA+<br />Friendly</p>
                      </div>
                    )}
                    {additionalInfo.nonSmoker && (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                          <span className="text-2xl">🚭</span>
                        </div>
                        <p className="text-sm text-gray-700 text-center">Non-Smoker</p>
                      </div>
                    )}
                    {additionalInfo.petFriendly && (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                          <span className="text-2xl">🐾</span>
                        </div>
                        <p className="text-sm text-gray-700 text-center">Pet Friendly</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Crop Modal */}
      {showCropModal && selectedImageUrl && (
        <ImageCropModal
          imageUrl={selectedImageUrl}
          onClose={handleCloseCropModal}
          onCropComplete={handleCropComplete}
        />
      )}
    </DashboardLayout>
  );
}

export default function ProfilePreviewPage() {
  return (
    <QueryProvider>
      <ProfilePreviewContent />
    </QueryProvider>
  );
}
