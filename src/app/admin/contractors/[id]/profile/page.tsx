"use client";

import * as React from 'react';
import { use, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, ChevronDown, Share2, Copy, Check } from "lucide-react";
import Loader from "@/components/ui/Loader";
import WorkerProfileView from "@/components/profile/WorkerProfileView";
import { getWorkerProfilePreview } from "@/services/worker/profilePreview.service";
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

  // Handle PDF download - client-side generation
  const handleDownloadPDF = useCallback(async () => {
    try {
      setIsDownloadingPDF(true);

      // Wait a bit for any pending renders
      await new Promise(resolve => setTimeout(resolve, 100));

      // Dynamically import libraries
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      // Get the profile page element
      const element = document.querySelector('.profile-preview-page') as HTMLElement;
      if (!element) {
        throw new Error('Profile page not found');
      }

      // Store original styles
      const originalBoxShadow = element.style.boxShadow;
      const originalBorderRadius = element.style.borderRadius;

      // Hide header buttons during capture
      const headerSection = element.querySelector('.profile-preview-back-section') as HTMLElement | null;
      const originalHeaderDisplay = headerSection?.style.display ?? '';
      if (headerSection) headerSection.style.display = 'none';

      // Remove visual effects for cleaner PDF
      element.style.boxShadow = 'none';
      element.style.borderRadius = '0';

      // Generate PNG from HTML with high quality
      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      // Restore original styles
      element.style.boxShadow = originalBoxShadow;
      element.style.borderRadius = originalBorderRadius;
      if (headerSection) headerSection.style.display = originalHeaderDisplay;

      // Get image dimensions
      const img = window.document.createElement('img');
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
      });

      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Calculate image dimensions to fit A4
      const imgWidth = pageWidth;
      const imgHeight = (img.height * pageWidth) / img.width;

      // Add image to PDF
      pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');

      // Download PDF
      const lastInitial = profileData?.profile?.lastName?.charAt(0) ?? '';
      const fileName = `${profileData?.profile?.firstName}${lastInitial}_Profile.pdf`;
      pdf.save(fileName);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate PDF: ${errorMsg}`);
    } finally {
      setIsDownloadingPDF(false);
    }
  }, [profileData?.profile?.firstName, profileData?.profile?.lastName]);

  // Handle JPEG download
  const handleDownloadJPEG = useCallback(async () => {
    try {
      setShowDownloadDropdown(false);
      setIsDownloadingJPEG(true);

      await new Promise(resolve => setTimeout(resolve, 100));

      const { toJpeg } = await import('html-to-image');

      const element = document.querySelector('.profile-preview-page') as HTMLElement;
      if (!element) throw new Error('Profile page not found');

      const originalBoxShadow = element.style.boxShadow;
      const originalBorderRadius = element.style.borderRadius;

      // Hide header buttons during capture
      const headerSection = element.querySelector('.profile-preview-back-section') as HTMLElement | null;
      const originalHeaderDisplay = headerSection?.style.display ?? '';
      if (headerSection) headerSection.style.display = 'none';

      element.style.boxShadow = 'none';
      element.style.borderRadius = '0';

      const dataUrl = await toJpeg(element, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      element.style.boxShadow = originalBoxShadow;
      element.style.borderRadius = originalBorderRadius;
      if (headerSection) headerSection.style.display = originalHeaderDisplay;

      const link = document.createElement('a');
      const lastInitialJpeg = profileData?.profile?.lastName?.charAt(0) ?? '';
      link.download = `${profileData?.profile?.firstName}${lastInitialJpeg}_Profile.jpeg`;
      link.href = dataUrl;
      link.click();

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate JPEG: ${errorMsg}`);
    } finally {
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

  // Format services separated by slashes
  // For Therapeutic Supports, show subcategory names; for others, show category name
  const servicesText = services && services.length > 0
    ? services.flatMap((service: any) => {
        if (service.categoryName === "Therapeutic Supports" && service.subcategories?.length > 0) {
          return service.subcategories.map((sub: any) => sub.subcategoryName);
        }
        return [service.categoryName];
      }).join(" / ")
    : "Support Worker";

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
                {profile.firstName}, {profile.lastName?.[0]}.
              </h1>
              <p className="profile-preview-roles">
                {servicesText}
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
        />
      </div>

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
