/**
 * Step 2: Profile Photo
 * Upload profile photo with preview and guidelines
 */

import PhotoUpload from "@/components/forms/fields/PhotoUpload";

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
          <div className="info-box-icon">
            <svg
              className="icon-camera"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 className="info-box-title">Photo guidelines</h3>
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
  );
}
