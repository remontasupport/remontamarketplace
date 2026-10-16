"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { reloadProfileInto } from "@/features/worker/profile";
import { ArrowLeft } from "lucide-react";
import { useProfilePreview } from "@/hooks/useProfilePreview";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Loader from "@/components/ui/Loader";
import ImageCropModal from "@/components/modals/ImageCropModal";
import { blobUrlToFile } from "@/utils/imageCrop";
import { uploadProfilePhoto } from "@/features/worker/photo";
import WorkerProfileView from "@/components/profile/WorkerProfileView";
import "@/app/styles/profile-preview.css";

function ProfilePreviewContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: profileData, isLoading, error } = useProfilePreview();

  // Photo upload state
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Handle photo file selection
  const handlePhotoClick = () => {
    document.getElementById('photo-upload-input')?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];
    if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
      alert("Only JPG, PNG, WebP, and HEIC formats are allowed");
      return;
    }

    // Validate file size (50MB)
    const maxSizeBytes = 50 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      alert("File size must be less than 50MB");
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

      // U5c: the My Profile photo flow (apps/api): shrink -> ticket -> straight to the bucket -> confirm.
      const result = await uploadProfilePhoto(croppedFile);
      if (!result.ok) throw new Error(result.message);
      await reloadProfileInto(queryClient); // the new photo, past the private cache
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
    <DashboardLayout showProfileCard={false}>
      <div className="profile-preview-page">
        {/* Back Button */}
        <div className="profile-preview-back-section">
          <button className="profile-preview-back-button" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
            <span>Edit my profile</span>
          </button>
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
        <WorkerProfileView
          profile={profile}
          services={services}
          qualifications={qualifications}
          additionalInfo={additionalInfo}
          isAdminView={false}
        />
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
    <ProfilePreviewContent />
  );
}
