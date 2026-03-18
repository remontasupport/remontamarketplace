"use client";

import * as React from 'react';
import { use, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, ChevronDown, Share2, Copy, Check, Pencil, Upload } from "lucide-react";
import Loader from "@/components/ui/Loader";
import WorkerProfileView from "@/components/profile/WorkerProfileView";
import ImageCropModal from "@/components/modals/ImageCropModal";
import { getWorkerProfilePreview } from "@/services/worker/profilePreview.service";
import { useProfileEditor } from "@/hooks/useProfileEditor";
import "@/app/styles/profile-preview.css";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminWorkerProfilePage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const workerId = resolvedParams.id;

  const [profileData, setProfileData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isDownloadingJPEG, setIsDownloadingJPEG] = useState(false);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const downloadDropdownRef = useRef<HTMLDivElement>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState<string>("");
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Photo editing state
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [croppedImageUrl, setCroppedImageUrl] = useState('');
  const [showCropModal, setShowCropModal] = useState(false);

  // Compute job title early (before conditional returns) so the hook call is always at top level.
  // Use '' until profileData is loaded so the hook doesn't initialize with the fallback too early.
  const rawServices = profileData?.services;
  const servicesText = !profileData
    ? ''
    : rawServices && rawServices.length > 0
      ? rawServices.flatMap((service: any) => {
          if (service.categoryName === "Therapeutic Supports" && service.subcategories?.length > 0) {
            return service.subcategories.map((sub: any) => sub.subcategoryName);
          }
          return [service.categoryName];
        }).join(" / ")
      : "Support Worker";

  const introduction = profileData?.profile?.introduction ?? '';
  const funFact = profileData?.additionalInfo?.funFact ?? '';
  const initialUniqueServices: string[] = !profileData
    ? []
    : Array.isArray(profileData?.additionalInfo?.uniqueService)
      ? profileData.additionalInfo.uniqueService
      : [];

  const initialServices = !profileData
    ? []
    : (rawServices ?? []).filter(
        (s: any) => s.subcategories?.length > 0 && s.categoryName !== 'Therapeutic Supports'
      );

  const initialMoreInfo = {
    languages: Array.isArray(profileData?.additionalInfo?.languages) ? profileData.additionalInfo.languages : [],
    culturalBackground: Array.isArray(profileData?.additionalInfo?.culturalBackground) ? profileData.additionalInfo.culturalBackground : [],
    religion: Array.isArray(profileData?.additionalInfo?.religion) ? profileData.additionalInfo.religion : [],
    interests: Array.isArray(profileData?.additionalInfo?.interests) ? profileData.additionalInfo.interests : [],
    personality: profileData?.additionalInfo?.personality ?? '',
  };

  const { isEditMode, toggleEditMode, state, updateField, removeServiceCategory, removeSubcategory, addSubcategory, toggleSection, addUniqueService, removeUniqueService, addInfoItem, removeInfoItem, addExperienceItem, updateExperienceItem, removeExperienceItem } =
    useProfileEditor(servicesText, introduction, funFact, initialServices, initialUniqueServices, initialMoreInfo);

  // Close download dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(e.target as Node)) {
        setShowDownloadDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const data = await getWorkerProfilePreview(workerId);
        setProfileData(data);
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    if (workerId) {
      fetchProfile();
    }
  }, [workerId]);

  // Photo editing handlers
  const handleImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Please select a valid image file'); return }
    if (file.size > 50 * 1024 * 1024) { alert('Image size must be less than 50MB'); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      setSelectedImageUrl(e.target?.result as string)
      setCroppedImageUrl('')
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }, [])

  const handlePhotoDoubleClick = useCallback(() => {
    if (isEditMode && (selectedImageUrl || profileData?.profile?.photos)) {
      setShowCropModal(true)
    }
  }, [isEditMode, selectedImageUrl, profileData?.profile?.photos])

  const handleCropComplete = useCallback((croppedUrl: string) => {
    setCroppedImageUrl(croppedUrl)
    setShowCropModal(false)
  }, [])

  // Handle Generate Share Link
  const handleGenerateShareLink = useCallback(async () => {
    try {
      setIsGeneratingLink(true);

      // Call API to generate JWT token server-side
      const response = await fetch('/api/share/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: workerId, expiryTime: '30d' })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate token');
      }

      // Create full URL
      const baseUrl = window.location.origin;
      const fullShareLink = `${baseUrl}/share/profile/${data.token}`;

      setShareLink(fullShareLink);
      setShowShareModal(true);
      setIsCopied(false);
    } catch (error) {
      console.error('Error generating share link:', error);
      alert('Failed to generate share link');
    } finally {
      setIsGeneratingLink(false);
    }
  }, [workerId]);

  // Handle Copy Link
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
      alert('Failed to copy link');
    }
  }, [shareLink]);

  // Handle PDF download - multi-page, all content visible
  const handleDownloadPDF = useCallback(async () => {
    const CAPTURE_WIDTH = 1200;

    const element = document.querySelector('.profile-preview-page') as HTMLElement;
    const origWidth = element?.style.width ?? '';
    const origMaxWidth = element?.style.maxWidth ?? '';

    try {
      setIsDownloadingPDF(true);

      if (!element) throw new Error('Profile page not found');

      await new Promise(resolve => setTimeout(resolve, 100));

      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      // Fix capture width for consistent layout
      element.style.width = `${CAPTURE_WIDTH}px`;
      element.style.maxWidth = `${CAPTURE_WIDTH}px`;
      void element.getBoundingClientRect();
      await new Promise(resolve => setTimeout(resolve, 150));

      const originalBoxShadow = element.style.boxShadow;
      const originalBorderRadius = element.style.borderRadius;

      const headerSection = element.querySelector('.profile-preview-back-section') as HTMLElement | null;
      const origHeaderDisplay = headerSection?.style.display ?? '';
      if (headerSection) headerSection.style.display = 'none';

      element.style.boxShadow = 'none';
      element.style.borderRadius = '0';

      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      element.style.boxShadow = originalBoxShadow;
      element.style.borderRadius = originalBorderRadius;
      if (headerSection) headerSection.style.display = origHeaderDisplay;

      // Load image to get dimensions
      const img = document.createElement('img');
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (img.height * pageWidth) / img.width;

      // Render all content across as many A4 pages as needed
      let yOffset = 0;
      let pageNum = 0;
      while (yOffset < imgHeight) {
        if (pageNum > 0) pdf.addPage();
        // Draw the full image shifted up so the correct slice shows on this page
        pdf.addImage(dataUrl, 'PNG', 0, -yOffset, imgWidth, imgHeight, undefined, 'FAST');
        yOffset += pageHeight;
        pageNum++;
      }

      const lastInitial = profileData?.profile?.lastName?.charAt(0) ?? '';
      pdf.save(`${profileData?.profile?.firstName}${lastInitial}_Profile.pdf`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate PDF: ${errorMsg}`);
    } finally {
      if (element) {
        element.style.width = origWidth;
        element.style.maxWidth = origMaxWidth;
      }
      setIsDownloadingPDF(false);
    }
  }, [profileData?.profile?.firstName, profileData?.profile?.lastName]);

  // Handle JPEG download — single file, wide landscape-friendly format for FB sharing
  const handleDownloadJPEG = useCallback(async () => {
    const CAPTURE_WIDTH = 1600;

    const element = document.querySelector('.profile-preview-page') as HTMLElement;
    const origWidth = element?.style.width ?? '';
    const origMaxWidth = element?.style.maxWidth ?? '';

    try {
      setShowDownloadDropdown(false);
      setIsDownloadingJPEG(true);

      if (!element) throw new Error('Profile page not found');

      await new Promise(resolve => setTimeout(resolve, 100));

      const { toJpeg } = await import('html-to-image');

      element.style.width = `${CAPTURE_WIDTH}px`;
      element.style.maxWidth = `${CAPTURE_WIDTH}px`;
      void element.getBoundingClientRect();

      element.classList.add('downloading');
      await new Promise(resolve => setTimeout(resolve, 200));

      const headerSection = element.querySelector('.profile-preview-back-section') as HTMLElement | null;
      const origHeaderDisplay = headerSection?.style.display ?? '';
      if (headerSection) headerSection.style.display = 'none';

      const dataUrl = await toJpeg(element, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      if (headerSection) headerSection.style.display = origHeaderDisplay;

      const link = document.createElement('a');
      const lastInitial = profileData?.profile?.lastName?.charAt(0) ?? '';
      link.download = `${profileData?.profile?.firstName}${lastInitial}_Profile.jpeg`;
      link.href = dataUrl;
      link.click();

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate JPEG: ${errorMsg}`);
    } finally {
      if (element) {
        element.style.width = origWidth;
        element.style.maxWidth = origMaxWidth;
        element.classList.remove('downloading');
      }
      setIsDownloadingJPEG(false);
    }
  }, [profileData?.profile?.firstName, profileData?.profile?.lastName]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-white">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <p className="text-red-600">{error || "Failed to load profile data"}</p>
        </div>
      </div>
    );
  }

  const { profile, services, qualifications, additionalInfo } = profileData;

  // Generate initials
  const initials = profile?.firstName && profile?.lastName
    ? `${profile.firstName[0]}${profile.lastName[0]}`
    : "U";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="profile-preview-page">
        {/* Header Actions */}
        <div className="profile-preview-back-section flex items-center justify-between">
          <button className="profile-preview-back-button" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
            <span>Back to dashboard</span>
          </button>

          <div className="flex items-center gap-3">
            {/* Generate Share Link Button */}
            <button
              onClick={handleGenerateShareLink}
              disabled={isGeneratingLink}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingLink ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-5 h-5" />
                  <span>Share Profile</span>
                </>
              )}
            </button>

            {/* Edit Profile Button */}
            <button
              onClick={toggleEditMode}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium border ${
                isEditMode
                  ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Pencil className="w-5 h-5" />
              <span>{isEditMode ? 'Done Editing' : 'Edit Profile'}</span>
            </button>

            {/* Download Dropdown */}
            <div className="relative" ref={downloadDropdownRef}>
              <button
                onClick={() => setShowDownloadDropdown(prev => !prev)}
                disabled={isDownloadingPDF || isDownloadingJPEG}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloadingPDF || isDownloadingJPEG ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                    <span>{isDownloadingPDF ? 'Generating PDF...' : 'Generating JPEG...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Download</span>
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>

              {showDownloadDropdown && !isDownloadingPDF && !isDownloadingJPEG && (
                <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-10">
                  <button
                    onClick={() => { setShowDownloadDropdown(false); handleDownloadPDF(); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-4 h-4 text-indigo-600" />
                    PDF
                  </button>
                  <button
                    onClick={handleDownloadJPEG}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-4 h-4 text-indigo-600" />
                    JPEG
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Header */}
        <div className="profile-preview-header">
          <div className="profile-preview-header-content">
            {/* Avatar */}
            <div
              className="profile-preview-avatar relative"
              onDoubleClick={handlePhotoDoubleClick}
              style={{ cursor: isEditMode && (selectedImageUrl || profile?.photos) ? 'pointer' : 'default' }}
              title={isEditMode && (selectedImageUrl || profile?.photos) ? 'Double-click to crop image' : ''}
            >
              {(croppedImageUrl || selectedImageUrl || profile?.photos) ? (
                <img
                  src={croppedImageUrl || selectedImageUrl || profile.photos}
                  alt={`${profile.firstName} ${profile.lastName}`}
                  style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: 'inherit' }}
                />
              ) : (
                <div className="profile-preview-avatar-placeholder">
                  {initials}
                </div>
              )}
              {isEditMode && (
                <div className="absolute inset-0 flex items-end justify-center pb-2 rounded-full overflow-hidden">
                  <input
                    type="file"
                    id="profile-photo-upload"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    aria-label="Upload new photo"
                  />
                  <label
                    htmlFor="profile-photo-upload"
                    className="flex items-center gap-1 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded cursor-pointer hover:bg-opacity-80 transition-all"
                  >
                    <Upload className="w-3 h-3" />
                    Change Photo
                  </label>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="profile-preview-info">
              <h1 className="profile-preview-name">
                {profile.firstName}, {profile.lastName?.[0]}.
              </h1>
              <p
                contentEditable={isEditMode}
                suppressContentEditableWarning
                onFocus={(e) => {
                  const range = document.createRange()
                  range.selectNodeContents(e.currentTarget)
                  const selection = window.getSelection()
                  selection?.removeAllRanges()
                  selection?.addRange(range)
                }}
                onBlur={(e) => updateField('customJobTitle', e.currentTarget.textContent || '')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.currentTarget.blur()
                  }
                }}
                className={`profile-preview-roles ${isEditMode ? 'outline outline-2 outline-indigo-300 rounded px-1 cursor-text' : ''}`}
              >
                {state.customJobTitle}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <WorkerProfileView
          profile={profile}
          services={services}
          qualifications={qualifications}
          additionalInfo={additionalInfo}
          isAdminView={true}
          isEditMode={isEditMode}
          editableState={state}
          onUpdateField={updateField}
          onRemoveServiceCategory={removeServiceCategory}
          onRemoveSubcategory={removeSubcategory}
          onAddSubcategory={addSubcategory}
          onToggleSection={toggleSection}
          onAddUniqueService={addUniqueService}
          onRemoveUniqueService={removeUniqueService}
          onAddInfoItem={addInfoItem}
          onRemoveInfoItem={removeInfoItem}
          onAddExperienceItem={addExperienceItem}
          onUpdateExperienceItem={updateExperienceItem}
          onRemoveExperienceItem={removeExperienceItem}
        />
      </div>

      {/* Image Crop Modal */}
      {showCropModal && (selectedImageUrl || profileData?.profile?.photos) && (
        <ImageCropModal
          imageUrl={selectedImageUrl || profileData.profile.photos}
          onClose={() => setShowCropModal(false)}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Share Link Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowShareModal(false)}
          ></div>

          {/* Modal */}
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 transform transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Modal Content */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <Share2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Share Profile Link
                    </h3>
                    <p className="text-sm text-gray-500">
                      Anyone with this link can view the profile
                    </p>
                  </div>
                </div>

                {/* Share Link Display */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <label className="text-xs font-medium text-gray-600 mb-2 block">
                    Shareable Link (expires in 30 days)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 font-mono"
                      onClick={(e) => e.currentTarget.select()}
                    />
                    <button
                      onClick={handleCopyLink}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        isCopied
                          ? 'bg-green-600 text-white'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Info Box */}
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">About Share Links</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Link expires automatically after 30 days</li>
                        <li>• Anyone with the link can view this profile</li>
                        <li>• Generate a new link anytime to replace the old one</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
