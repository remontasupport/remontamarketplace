/**
 * Step 2: Profile Photo
 * Upload profile photo with preview and guidelines
 */

import PhotoUpload from "@/components/forms/fields/PhotoUpload";
import { CameraIcon } from "@heroicons/react/24/outline";
import StepContentWrapper from "../shared/StepContentWrapper";

interface Step2PhotoProps {
  data: {
    photo: string | null;
  };
  onChange: (field: string, value: any) => void;
  onPhotoSave?: (photoUrl: string) => Promise<void>; // Callback to save to DB
  errors?: {
    photo?: string;
  };
}

export default function Step2Photo({ data, onChange, onPhotoSave, errors }: Step2PhotoProps) {
  const handlePhotoChange = (photoUrl: string | null) => {
    onChange("photo", photoUrl);
  };

  return (
    <StepContentWrapper>
      <div className="form-page-content">
      {/* Left Column - Photo Upload */}
      <div className="form-column">
        <div className="account-form">
          <p className="field-helper-text" style={{ marginBottom: "1.5rem" }}>
            The first impression you give on the Mable platform matters. Your profile photo is a key element of your profile as it makes your profile more likely to be viewed by others. Your photo should give clients a clear idea of what you'd look like if they met you tomorrow.
          </p>

          {/* Photo Upload */}
          <PhotoUpload
            currentPhoto={data.photo}
            onPhotoChange={handlePhotoChange}
            onPhotoSave={onPhotoSave}
            maxSizeMB={10}
            error={errors?.photo}
          />
        </div>
      </div>

      {/* Right Column - Photo Guidelines */}
      <div className="info-column">
        <div className="info-box">
          <div className="info-box-header">
            <div className="info-box-icon">
              <CameraIcon className="icon-camera" />
            </div>
            <h3 className="info-box-title">Photo guidelines</h3>
          </div>
          <ul className="info-box-list">
            <li>Head and shoulders</li>
            <li>Colour photo</li>
            <li>Face visible, no sunglasses</li>
            <li>Smiling and professional</li>
            <li>Just you in the photo</li>
          </ul>
        </div>
      </div>
      </div>
    </StepContentWrapper>
  );
}
