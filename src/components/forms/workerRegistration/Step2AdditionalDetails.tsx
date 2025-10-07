import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Step2AdditionalDetailsProps {
  register: any;
  errors: any;
  currentStep: number;
}

export function Step2AdditionalDetails({ register, errors, currentStep }: Step2AdditionalDetailsProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-lg font-poppins font-medium">
          What is your current gender identity? <span className="text-red-500">*</span>
        </Label>
        <Input
          {...register("genderIdentity")}
          className="text-lg font-poppins"
        />
        {errors.genderIdentity && <p className="text-red-500 text-sm font-poppins">{errors.genderIdentity.message}</p>}
      </div>

      <div>
        <Label className="text-lg font-poppins font-medium">
          City <span className="text-red-500">*</span>
        </Label>
        <Input
          {...register("city")}
          key={`city-${currentStep}`}
          className="text-lg font-poppins"
        />
        {errors.city && <p className="text-red-500 text-sm font-poppins">{errors.city.message}</p>}
      </div>

      <div>
        <Label className="text-lg font-poppins font-medium">
          State <span className="text-red-500">*</span>
        </Label>
        <Input
          {...register("state")}
          className="text-lg font-poppins"
        />
        {errors.state && <p className="text-red-500 text-sm font-poppins">{errors.state.message}</p>}
      </div>

      <div>
        <Label className="text-lg font-poppins font-medium">
          Languages Spoken <span className="text-red-500">*</span>
        </Label>
        <Input
          {...register("languages")}
          className="text-lg font-poppins"
        />
        {errors.languages && <p className="text-red-500 text-sm font-poppins">{errors.languages.message}</p>}
      </div>
    </div>
  );
}
