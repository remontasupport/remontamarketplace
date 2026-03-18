"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown, Users } from "lucide-react";
import { getQualificationDisplayName } from "@/utils/qualificationMapping";
import type { EditableProfileState, StringField, InfoArrayField } from "@/hooks/useProfileEditor";
import ServiceSelectionModal from "@/components/modals/ServiceSelectionModal";
import UniqueServiceSelectionModal from "@/components/modals/UniqueServiceSelectionModal";
import InfoItemSelectionModal from "@/components/modals/InfoItemSelectionModal";
import { LANGUAGES, CULTURAL_BACKGROUNDS, RELIGIONS, INTERESTS } from "@/constants/moreInfoOptions";

interface WorkerProfileViewProps {
  profile: any;
  services: any[];
  qualifications: any[];
  additionalInfo: any;
  isAdminView?: boolean;
  isPublicView?: boolean;
  isEditMode?: boolean;
  editableState?: EditableProfileState;
  onUpdateField?: (field: StringField, value: string) => void;
  onRemoveServiceCategory?: (categoryId: string) => void;
  onRemoveSubcategory?: (categoryId: string, subcategoryName: string) => void;
  onAddSubcategory?: (categoryId: string, subcategoryName: string) => void;
  onToggleSection?: (sectionId: string) => void;
  onAddUniqueService?: (item: string) => void;
  onRemoveUniqueService?: (item: string) => void;
  onAddInfoItem?: (field: InfoArrayField, item: string) => void;
  onRemoveInfoItem?: (field: InfoArrayField, item: string) => void;
  onAddExperienceItem?: () => void;
  onUpdateExperienceItem?: (index: number, value: string) => void;
  onRemoveExperienceItem?: (index: number) => void;
}

export default function WorkerProfileView({
  profile,
  services,
  qualifications,
  additionalInfo,
  isAdminView = false,
  isPublicView = false,
  isEditMode = false,
  editableState,
  onUpdateField,
  onRemoveServiceCategory,
  onRemoveSubcategory,
  onAddSubcategory,
  onToggleSection,
  onAddUniqueService,
  onRemoveUniqueService,
  onAddInfoItem,
  onRemoveInfoItem,
  onAddExperienceItem,
  onUpdateExperienceItem,
  onRemoveExperienceItem,
}: WorkerProfileViewProps) {
  const router = useRouter();

  const isHidden = (sectionId: string) => editableState?.hiddenSections.includes(sectionId) ?? false

  const SectionRemoveButton = ({ sectionId }: { sectionId: string }) =>
    isEditMode ? (
      <button
        onClick={() => onToggleSection?.(sectionId)}
        className={`text-xs font-medium transition-colors ${
          isHidden(sectionId)
            ? 'text-indigo-500 hover:text-indigo-700'
            : 'text-red-400 hover:text-red-600'
        }`}
      >
        {isHidden(sectionId) ? '+ Restore' : '✕ Remove'}
      </button>
    ) : null

  // Service category expansion state — open by default if category has data
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>(() => {
    if (!additionalInfo?.experience || typeof additionalInfo.experience !== 'object') return {};
    return Object.fromEntries(
      Object.entries(additionalInfo.experience)
        .filter(([, data]: [string, any]) => data?.description)
        .map(([categoryId]) => [categoryId, true])
    );
  });

  // Unique services expansion state
  const [showAllUniqueServices, setShowAllUniqueServices] = useState(false);

  // Service subcategory modal state
  const [addSubcategoryTargetId, setAddSubcategoryTargetId] = useState<string | null>(null);

  // Unique service modal state
  const [showUniqueServiceModal, setShowUniqueServiceModal] = useState(false);

  // Info item modal state
  const [activeInfoModal, setActiveInfoModal] = useState<InfoArrayField | null>(null);

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
      {!isHidden('about-me') && <div className="profile-preview-section">
        <div className="flex items-center justify-between">
          <h2 className="profile-preview-section-title">About Me</h2>
          <SectionRemoveButton sectionId="about-me" />
        </div>
        {!isAdminView && !isPublicView && (
          <button
            className="profile-preview-edit-link"
            onClick={() => router.push('/dashboard/worker/account/setup?step=bio')}
          >
            Edit bio
          </button>
        )}
        <p
          contentEditable={isEditMode}
          suppressContentEditableWarning
          onFocus={(e) => {
            if (!isEditMode) return
            const range = document.createRange()
            range.selectNodeContents(e.currentTarget)
            const selection = window.getSelection()
            selection?.removeAllRanges()
            selection?.addRange(range)
          }}
          onBlur={(e) => onUpdateField?.('introduction', e.currentTarget.textContent || '')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              e.currentTarget.blur()
            }
          }}
          className={`profile-preview-text ${isEditMode ? 'outline outline-2 outline-indigo-300 rounded px-1 cursor-text' : ''} ${!editableState?.introduction && !isEditMode ? 'text-gray-400 italic' : ''}`}
        >
          {editableState?.introduction || (!isAdminView && !isPublicView ? 'No introduction provided yet.' : '')}
        </p>
      </div>}

      {/* Two Column Layout */}
      <div className="profile-preview-grid">
        {/* Left Column */}
        <div className="profile-preview-column">
          {/* Basic Information Section */}
          {!isHidden('basic-information') && <div className="profile-preview-section about-me-section">
            <div className="flex items-center justify-between">
              <h3 className="profile-preview-subsection-title">Basic Information</h3>
              <SectionRemoveButton sectionId="basic-information" />
            </div>

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
          </div>}

          {/* Experience */}
          {!isHidden('experience') && (() => {
            const hasRealExperience = Object.entries(additionalInfo?.experience ?? {}).some(
              ([, data]: [string, any]) => data?.description
            )
            const experienceItems = editableState?.editableExperienceItems ?? []
            return (
            <div className="profile-preview-section">
              <div className="flex items-center justify-between">
                <h3 className="profile-preview-subsection-title">Experience</h3>
                <div className="flex items-center gap-2">
                  {isEditMode && !hasRealExperience && (
                    <button
                      onClick={() => onAddExperienceItem?.()}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                    >
                      + Add
                    </button>
                  )}
                  <SectionRemoveButton sectionId="experience" />
                </div>
              </div>
              {hasRealExperience ? (
              /* Experience Categories (real data) */
              <div className="space-y-4">
                {Object.entries(additionalInfo?.experience ?? {}).map(([categoryId, experienceData]: [string, any]) => {
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
              ) : (
              /* Editable simple list (no real experience data) */
              <div className="space-y-2">
                {experienceItems.map((item, index) => (
                  <div key={index} className="profile-preview-qualification-item justify-between">
                    <div className="flex items-center gap-1 flex-1">
                      <span className="profile-preview-checkmark" style={{ fontSize: '24px' }}>•</span>
                      <span
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                        onFocus={(e) => {
                          if (!isEditMode) return
                          const range = document.createRange()
                          range.selectNodeContents(e.currentTarget)
                          const selection = window.getSelection()
                          selection?.removeAllRanges()
                          selection?.addRange(range)
                        }}
                        onBlur={(e) => onUpdateExperienceItem?.(index, e.currentTarget.textContent || '')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur() }
                        }}
                        className={`text-base text-gray-900 ${isEditMode ? 'outline outline-2 outline-indigo-300 rounded px-1 cursor-text' : ''}`}
                      >
                        {item}
                      </span>
                    </div>
                    {isEditMode && (
                      <button
                        onClick={() => onRemoveExperienceItem?.(index)}
                        className="text-red-400 hover:text-red-600 ml-2 transition-colors"
                        title="Remove"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {experienceItems.length === 0 && (
                  <p className="text-sm text-gray-400 italic">
                    {isEditMode ? 'Click "+ Add" to add experience items.' : 'No experience added yet.'}
                  </p>
                )}
              </div>
              )}
            </div>
            )
          })()}

          {/* Job History */}
          {!isHidden('job-history') && (
            <div className="profile-preview-section">
              <div className="flex items-center justify-between">
                <h3 className="profile-preview-subsection-title">Job History</h3>
                <SectionRemoveButton sectionId="job-history" />
              </div>
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
          {!isHidden('education-history') && <div className="profile-preview-section">
            <div className="flex items-center justify-between">
              <h3 className="profile-preview-subsection-title">Education History</h3>
              <SectionRemoveButton sectionId="education-history" />
            </div>
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
          </div>}

          {/* More Information */}
          {!isHidden('more-information') && <div className="profile-preview-section">
            <div className="flex items-center justify-between">
              <h3 className="profile-preview-subsection-title">More information</h3>
              <SectionRemoveButton sectionId="more-information" />
            </div>


            {/* Language */}
            {(() => {
              const langs = editableState?.editableLanguages ?? (additionalInfo?.languages ?? [])
              if (!isEditMode && langs.length === 0) return null
              return (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-poppins font-semibold text-gray-700">Language</h4>
                    {isEditMode && (
                      <button onClick={() => setActiveInfoModal('editableLanguages')} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                        + Add
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {langs.map((lang: string, index: number) => (
                      <span key={index} className="inline-flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-base">
                        {lang}
                        {isEditMode && (
                          <button onClick={() => onRemoveInfoItem?.('editableLanguages', lang)} className="text-red-400 hover:text-red-600 ml-1 transition-colors leading-none" title="Remove">✕</button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Cultural backgrounds */}
            {(() => {
              const cultures = editableState?.editableCulturalBackground ?? (additionalInfo?.culturalBackground ?? [])
              if (!isEditMode && cultures.length === 0) return null
              return (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-poppins font-semibold text-gray-700">Cultural backgrounds</h4>
                    {isEditMode && (
                      <button onClick={() => setActiveInfoModal('editableCulturalBackground')} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                        + Add
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cultures.map((culture: string, index: number) => (
                      <span key={index} className="inline-flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-base">
                        {culture}
                        {isEditMode && (
                          <button onClick={() => onRemoveInfoItem?.('editableCulturalBackground', culture)} className="text-red-400 hover:text-red-600 ml-1 transition-colors leading-none" title="Remove">✕</button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Religion */}
            {(() => {
              const religions = editableState?.editableReligion ?? (additionalInfo?.religion ?? [])
              if (!isEditMode && religions.length === 0) return null
              return (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-poppins font-semibold text-gray-700">Religion</h4>
                    {isEditMode && (
                      <button onClick={() => setActiveInfoModal('editableReligion')} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                        + Add
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {religions.map((rel: string, index: number) => (
                      <span key={index} className="inline-flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-base">
                        {rel}
                        {isEditMode && (
                          <button onClick={() => onRemoveInfoItem?.('editableReligion', rel)} className="text-red-400 hover:text-red-600 ml-1 transition-colors leading-none" title="Remove">✕</button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Interests */}
            {(() => {
              const interests = editableState?.editableInterests ?? (additionalInfo?.interests ?? [])
              if (!isEditMode && interests.length === 0) return null
              return (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-poppins font-semibold text-gray-700">Interests</h4>
                    {isEditMode && (
                      <button onClick={() => setActiveInfoModal('editableInterests')} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                        + Add
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest: string, index: number) => (
                      <span key={index} className="inline-flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-base">
                        {interest}
                        {isEditMode && (
                          <button onClick={() => onRemoveInfoItem?.('editableInterests', interest)} className="text-red-400 hover:text-red-600 ml-1 transition-colors leading-none" title="Remove">✕</button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Personality */}
            {(() => {
              const personality = editableState?.personality ?? additionalInfo?.personality ?? ''
              if (!isEditMode && !personality) return null
              return (
                <div className="mb-4">
                  <h4 className="text-base font-poppins font-semibold text-gray-700 mb-2">Personality</h4>
                  <p
                    contentEditable={isEditMode}
                    suppressContentEditableWarning
                    onFocus={(e) => {
                      if (!isEditMode) return
                      const range = document.createRange()
                      range.selectNodeContents(e.currentTarget)
                      const selection = window.getSelection()
                      selection?.removeAllRanges()
                      selection?.addRange(range)
                    }}
                    onBlur={(e) => onUpdateField?.('personality', e.currentTarget.textContent || '')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur() }
                    }}
                    className={`text-base text-gray-700 ${isEditMode ? 'outline outline-2 outline-indigo-300 rounded px-1 cursor-text' : ''}`}
                  >
                    {personality}
                  </p>
                </div>
              )
            })()}
          </div>}

          {/* Info item modals */}
          {activeInfoModal === 'editableLanguages' && (
            <InfoItemSelectionModal
              title="Language"
              options={LANGUAGES}
              selectedItems={editableState?.editableLanguages ?? (additionalInfo?.languages ?? [])}
              onClose={() => setActiveInfoModal(null)}
              onSelectItem={(item) => { onAddInfoItem?.('editableLanguages', item); setActiveInfoModal(null) }}
            />
          )}
          {activeInfoModal === 'editableCulturalBackground' && (
            <InfoItemSelectionModal
              title="Cultural Background"
              options={CULTURAL_BACKGROUNDS}
              selectedItems={editableState?.editableCulturalBackground ?? (additionalInfo?.culturalBackground ?? [])}
              onClose={() => setActiveInfoModal(null)}
              onSelectItem={(item) => { onAddInfoItem?.('editableCulturalBackground', item); setActiveInfoModal(null) }}
            />
          )}
          {activeInfoModal === 'editableReligion' && (
            <InfoItemSelectionModal
              title="Religion"
              options={RELIGIONS}
              selectedItems={editableState?.editableReligion ?? (additionalInfo?.religion ?? [])}
              onClose={() => setActiveInfoModal(null)}
              onSelectItem={(item) => { onAddInfoItem?.('editableReligion', item); setActiveInfoModal(null) }}
            />
          )}
          {activeInfoModal === 'editableInterests' && (
            <InfoItemSelectionModal
              title="Interest"
              options={INTERESTS}
              selectedItems={editableState?.editableInterests ?? (additionalInfo?.interests ?? [])}
              onClose={() => setActiveInfoModal(null)}
              onSelectItem={(item) => { onAddInfoItem?.('editableInterests', item); setActiveInfoModal(null) }}
            />
          )}
        </div>

        {/* Right Column */}
        <div className="profile-preview-column">

          {/* Services Offered */}
          {(() => {
            const displayServices = editableState?.editableServices ?? servicesWithSubcategories;
            if (isHidden('services-offered')) return null;
            return (
              <div className="profile-preview-section services-offered-section">
                <div className="flex items-center justify-between">
                  <h3 className="profile-preview-subsection-title">Services offered</h3>
                  <SectionRemoveButton sectionId="services-offered" />
                </div>
                <div className="space-y-4">
                  {displayServices.map((service: any) => (
                    <div key={service.categoryId || service.id}>
                      {/* Category row */}
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-base font-poppins font-semibold text-gray-900">
                          {formatCategoryName(service.categoryName)}
                        </h4>
                        {isEditMode && (
                          <button
                            onClick={() => onRemoveServiceCategory?.(service.categoryId)}
                            className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors"
                            title="Remove category"
                          >
                            ✕ Remove
                          </button>
                        )}
                      </div>
                      {/* Subcategories */}
                      <div className="profile-preview-qualification-list ml-2">
                        {service.subcategories.map((sub: any, index: number) => (
                          <div key={index} className="profile-preview-qualification-item justify-between">
                            <div className="flex items-center gap-1">
                              <span className="profile-preview-checkmark" style={{ fontSize: '24px' }}>•</span>
                              <span>{sub.subcategoryName}</span>
                            </div>
                            {isEditMode && (
                              <button
                                onClick={() => onRemoveSubcategory?.(service.categoryId, sub.subcategoryName)}
                                className="text-red-400 hover:text-red-600 ml-2 transition-colors"
                                title="Remove subcategory"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {/* Add subcategory button */}
                      {isEditMode && (
                        <button
                          onClick={() => setAddSubcategoryTargetId(service.categoryId)}
                          className="mt-2 ml-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                        >
                          + Add subcategory
                        </button>
                      )}
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
            );
          })()}

          {/* Subcategory selection modal */}
          {addSubcategoryTargetId && (
            <ServiceSelectionModal
              onClose={() => setAddSubcategoryTargetId(null)}
              onSelectService={(subcategoryName) => {
                onAddSubcategory?.(addSubcategoryTargetId, subcategoryName)
                setAddSubcategoryTargetId(null)
              }}
            />
          )}

          {/* Unique Service */}
          {!isHidden('unique-service') && (
            <div className="profile-preview-section">
              <div className="flex items-center justify-between">
                <h3 className="profile-preview-subsection-title">Unique Service</h3>
                <div className="flex items-center gap-2">
                  {isEditMode && (
                    <button
                      onClick={() => setShowUniqueServiceModal(true)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                    >
                      + Add
                    </button>
                  )}
                  <SectionRemoveButton sectionId="unique-service" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const items = editableState?.editableUniqueServices ?? (additionalInfo?.uniqueService ?? [])
                  const displayed = showAllUniqueServices ? items : items.slice(0, 10)
                  return displayed.map((service: string, index: number) => (
                    <span key={index} className="inline-flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-base">
                      {service}
                      {isEditMode && (
                        <button
                          onClick={() => onRemoveUniqueService?.(service)}
                          className="text-red-400 hover:text-red-600 ml-1 transition-colors leading-none"
                          title="Remove"
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  ))
                })()}
              </div>
              {(editableState?.editableUniqueServices ?? additionalInfo?.uniqueService ?? []).length > 10 && (
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
                      Show {(editableState?.editableUniqueServices ?? additionalInfo?.uniqueService ?? []).length - 10} more
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Unique Service modal */}
          {showUniqueServiceModal && (
            <UniqueServiceSelectionModal
              selectedItems={editableState?.editableUniqueServices ?? (additionalInfo?.uniqueService ?? [])}
              onClose={() => setShowUniqueServiceModal(false)}
              onSelectItem={(item) => { onAddUniqueService?.(item); setShowUniqueServiceModal(false) }}
            />
          )}

          {/* Fun Fact */}
          {!isHidden('fun-fact') && (
            <div className="profile-preview-section">
              <div className="flex items-center justify-between">
                <h3 className="profile-preview-subsection-title">Fun Fact</h3>
                <SectionRemoveButton sectionId="fun-fact" />
              </div>
              <p
                contentEditable={isEditMode}
                suppressContentEditableWarning
                onFocus={(e) => {
                  if (!isEditMode) return
                  const range = document.createRange()
                  range.selectNodeContents(e.currentTarget)
                  const selection = window.getSelection()
                  selection?.removeAllRanges()
                  selection?.addRange(range)
                }}
                onBlur={(e) => onUpdateField?.('funFact', e.currentTarget.textContent || '')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    e.currentTarget.blur()
                  }
                }}
                className={`profile-preview-text ${isEditMode ? 'outline outline-2 outline-indigo-300 rounded px-1 cursor-text' : ''}`}
              >
                {editableState?.funFact ?? additionalInfo?.funFact}
              </p>
            </div>
          )}

          {/* Working Hours */}
          {!isHidden('working-hours') && (
            <div className="profile-preview-section">
              <div className="flex items-center justify-between">
                <h3 className="profile-preview-subsection-title">Working Hours</h3>
                <SectionRemoveButton sectionId="working-hours" />
              </div>
              <div className="space-y-4">
                {Object.entries((additionalInfo?.availability ?? {}) as Record<string, { startTime: string; endTime: string } | Array<{ startTime: string; endTime: string }>>).map(([day, timeSlots]) => {
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
          {!isHidden('good-to-know') && (
            <div className="profile-preview-section">
              <div className="flex items-center justify-between">
                <h3 className="profile-preview-subsection-title">Good to know</h3>
                <SectionRemoveButton sectionId="good-to-know" />
              </div>
              <div className="flex flex-wrap gap-4">
                {additionalInfo?.lgbtqiaSupport && (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                      <span className="text-2xl">🏳️‍🌈</span>
                    </div>
                    <p className="text-lg text-gray-700 text-center">LGBTQIA+<br />Friendly</p>
                  </div>
                )}
                {additionalInfo?.nonSmoker && (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                      <span className="text-2xl">🚭</span>
                    </div>
                    <p className="text-lg text-gray-700 text-center">Non-Smoker</p>
                  </div>
                )}
                {additionalInfo?.petFriendly && (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                      <span className="text-2xl">🐾</span>
                    </div>
                    <p className="text-lg text-gray-700 text-center">Pet Friendly</p>
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
