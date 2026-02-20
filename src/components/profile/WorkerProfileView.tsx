"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown, Users } from "lucide-react";
import { getQualificationDisplayName } from "@/utils/qualificationMapping";

interface WorkerProfileViewProps {
  profile: any;
  services: any[];
  qualifications: any[];
  additionalInfo: any;
  isAdminView?: boolean;
  isPublicView?: boolean;
}

export default function WorkerProfileView({
  profile,
  services,
  qualifications,
  additionalInfo,
  isAdminView = false,
  isPublicView = false
}: WorkerProfileViewProps) {
  const router = useRouter();

  // Service category expansion state
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});

  // Unique services expansion state
  const [showAllUniqueServices, setShowAllUniqueServices] = useState(false);

  // Toggle service category expansion
  const toggleServiceExpansion = (categoryId: string) => {
    setExpandedServices(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

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
      const startYear = job.startYear ? parseInt(job.startYear) : null;
      const startMonth = job.startMonth ? monthMap[job.startMonth] : 0;
      const endYear = job.endYear ? parseInt(job.endYear) : null;
      const endMonth = job.endMonth ? monthMap[job.endMonth] : 11;

      if (!startYear) return null;

      const startDate = new Date(startYear, startMonth || 0, 1);
      const endDate = endYear
        ? new Date(endYear, endMonth || 11, 1)
        : new Date();

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

  // Filter valid qualifications (those that are approved)
  const validQualifications = qualifications.filter(
    (qual) => qual.status === 'approved'
  );

  // Filter services that have subcategories, excluding Therapeutic Supports
  const servicesWithSubcategories = services.filter(
    service => service.subcategories && service.subcategories.length > 0 && service.categoryName !== 'Therapeutic Supports'
  );

  // Transform category names to cleaner display names
  const formatCategoryName = (categoryName: string): string => {
    const categoryNameMap: Record<string, string> = {
      "Support Worker": "Support Work",
      "Nursing Services": "Nursing",
      "Cleaning Services": "Cleaning",
      "Therapeutic Supports": "Therapeutic",
      "Home Modifications": "Home Modifications",
      "Fitness and Rehabilitation": "Fitness & Rehabilitation",
      "Home and Yard Maintenance": "Home & Yard Maintenance",
    };
    return categoryNameMap[categoryName] || categoryName;
  };

  return (
    <div className="profile-preview-content">
      {/* About Section */}
      <div className="profile-preview-section">
        <h2 className="profile-preview-section-title">
          {isAdminView ? `${profile.firstName} ${profile.lastName}` : `${profile.firstName}, ${profile.lastName?.[0]}.`}
        </h2>
        {!isAdminView && !isPublicView && (
          <button
            className="profile-preview-edit-link"
            onClick={() => router.push('/dashboard/worker/account/setup?step=bio')}
          >
            Edit bio
          </button>
        )}
        {profile.introduction ? (
          <p className="profile-preview-text">{profile.introduction}</p>
        ) : (
          !isAdminView && !isPublicView && (
            <p className="profile-preview-text text-gray-400 italic">
              No introduction provided yet. Click "Edit bio" to add your introduction.
            </p>
          )
        )}
      </div>

      {/* Two Column Layout */}
      <div className="profile-preview-grid">
        {/* Left Column */}
        <div className="profile-preview-column">
          {/* About Me Section */}
          <div className="profile-preview-section about-me-section">
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
                {profile?.city && profile?.state
                  ? `${profile.city}, ${profile.state}${profile.postalCode ? ` ${profile.postalCode}` : ''}`
                  : profile?.city || profile?.state || 'Not specified'}
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
                  // Map experience category IDs to display names
                  const experienceCategoryNames: { [key: string]: string } = {
                    "aged-care": "Aged care",
                    "chronic-medical": "Chronic medical conditions",
                    "disability": "Disability",
                    "mental-health": "Mental health",
                    "working-with-children": "Working with Children",
                  };

                  // Find the category name from services, or use the mapping, or fallback to formatted ID
                  const categoryService = services?.find(s => s.categoryId === categoryId);
                  const categoryName = categoryService?.categoryName
                    || experienceCategoryNames[categoryId]
                    || categoryId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

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

          {/* Services Offered - Hidden for Therapeutic Supports only */}
          {servicesWithSubcategories.length > 0 && (
            <div className="profile-preview-section services-offered-section">
              <h3 className="profile-preview-subsection-title">Services offered</h3>
              <div className="space-y-4">
                {servicesWithSubcategories.map((service: any) => (
                  <div key={service.categoryId || service.id}>
                    <h4 className="text-base font-poppins font-semibold text-gray-900 mb-2">
                      {formatCategoryName(service.categoryName)}
                    </h4>
                    <div className="profile-preview-qualification-list ml-2">
                      {service.subcategories.map((sub: any, index: number) => (
                        <div key={index} className="profile-preview-qualification-item">
                          <span className="profile-preview-checkmark" style={{ fontSize: '24px' }}>•</span>
                          <span>{sub.subcategoryName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {!isAdminView && !isPublicView && (
                <button
                  className="profile-preview-edit-link mt-3"
                  onClick={() => router.push('/dashboard/worker/services/manage')}
                >
                  Add more services
                </button>
              )}
            </div>
          )}

          {/* Unique Service */}
          {additionalInfo?.uniqueService && Array.isArray(additionalInfo.uniqueService) && additionalInfo.uniqueService.length > 0 && (
            <div className="profile-preview-section">
              <h3 className="profile-preview-subsection-title">Unique Service</h3>
              <div className="flex flex-wrap gap-2">
                {(showAllUniqueServices
                  ? additionalInfo.uniqueService
                  : additionalInfo.uniqueService.slice(0, 10)
                ).map((service: string, index: number) => (
                  <span key={index} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-base">
                    {service}
                  </span>
                ))}
              </div>
              {additionalInfo.uniqueService.length > 10 && (
                <button
                  type="button"
                  onClick={() => setShowAllUniqueServices(!showAllUniqueServices)}
                  className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showAllUniqueServices ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show {additionalInfo.uniqueService.length - 10} more
                    </>
                  )}
                </button>
              )}
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
  );
}
