import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";

interface Step7PhotosProps {
  errors: any;
  watchedConsentProfileShare: boolean | undefined;
  watchedConsentMarketing: boolean | undefined;
  setValue: any;
  trigger: any;
}

const Step7PhotosComponent = function Step7Photos({
  errors,
  watchedConsentProfileShare,
  watchedConsentMarketing,
  setValue,
  trigger,
}: Step7PhotosProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-poppins font-semibold">Consent</h3>

      <div>
        <Label className="text-lg font-poppins font-medium">Consent to Share Profile with Clients <span className="text-red-500">*</span></Label>
        <Card className="mt-2 p-4 border border-gray-200">
          <p className="text-sm font-poppins text-gray-700 mb-3">
            By ticking this box, I consent to <strong>Remonta</strong> sharing my submitted profile information and photo with potential clients.
          </p>
          <p className="text-sm font-poppins text-gray-700 mb-3">
            As part of working with <strong>Remonta</strong>, I understand and agree that my submitted profile information and photo will be shared with potential clients to help them choose the right worker for their needs.
          </p>
          <p className="text-sm font-poppins text-gray-700 mb-4">
            This is a necessary requirement to be considered for work opportunities.
          </p>
          <div className="flex items-start space-x-2">
            <Checkbox
              id="consent-profile"
              checked={watchedConsentProfileShare || false}
              onCheckedChange={(checked) => {
                const isChecked = !!checked;
                setValue("consentProfileShare", isChecked);
                trigger("consentProfileShare");
              }}
            />
            <Label htmlFor="consent-profile" className="text-sm font-poppins">
              I acknowledge and consent to my profile and photo will be shared with clients for matching purposes.
            </Label>
          </div>
        </Card>
        {errors.consentProfileShare && <p className="text-red-500 text-sm font-poppins">{errors.consentProfileShare.message}</p>}
      </div>

      <div>
        <Label className="text-lg font-poppins font-medium">Consent for Marketing and Social Media (Optional but Recommended)</Label>
        <Card className="mt-2 p-4 border border-gray-200">
          <p className="text-sm font-poppins text-gray-700 mb-3">
            By ticking this box, I consent to <strong>Remonta</strong> using my submitted profile information and photo for promotional purposes, including but not limited to the company website, social media channels, and marketing materials.
          </p>
          <p className="text-sm font-poppins text-gray-700 mb-3">
            This helps promote my services to a wider audience and may result in more opportunities.
          </p>
          <p className="text-sm font-poppins text-gray-700 mb-4">
            I understand that my image and information may be <strong>publicly visible</strong> to promote Remonta's services and my own.
          </p>
          <div className="flex items-start space-x-2">
            <Checkbox
              id="consent-marketing"
              checked={watchedConsentMarketing || false}
              onCheckedChange={(checked) => {
                setValue("consentMarketing", !!checked);
                trigger("consentMarketing");
              }}
            />
            <Label htmlFor="consent-marketing" className="text-sm font-poppins">
              I consent to the use of my profile and photo for marketing and social media purposes.
            </Label>
          </div>
        </Card>
      </div>
    </div>
  );
};

// Export without memoization - conditional rendering provides the optimization
export const Step7Photos = Step7PhotosComponent;
