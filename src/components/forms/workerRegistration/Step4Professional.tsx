import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Step4ProfessionalProps {
  register: any;
  control: any;
  errors: any;
  currentStep: number;
}

export function Step4Professional({ register, control, errors, currentStep }: Step4ProfessionalProps) {
  return (
    <div className="space-y-6">

      <div>
        <Label className="text-lg font-poppins font-medium">
          Years of Experience <span className="text-red-500">*</span>
        </Label>
        <Controller
          name="experience"
          control={control}
          render={({ field }) => (
            <Input
              type="number"
              min="0"
              max="99"
              className="text-lg font-poppins"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
            />
          )}
        />
        {errors.experience && <p className="text-red-500 text-sm font-poppins">{errors.experience.message}</p>}
      </div>

      <div>
        <Label className="text-lg font-poppins font-medium">
          Introduction: About you <span className="text-red-500">*</span>
        </Label>
        <Textarea
          {...register("introduction")}
          key={`introduction-${currentStep}`}
          className="text-lg font-poppins"
          rows={5}
          placeholder=""
        />
        <p className="text-sm text-gray-600 font-poppins mt-1">Answer in 1 to 2 sentences only.</p>
        {errors.introduction && <p className="text-red-500 text-sm font-poppins">{errors.introduction.message}</p>}
      </div>
    </div>
  );
}
