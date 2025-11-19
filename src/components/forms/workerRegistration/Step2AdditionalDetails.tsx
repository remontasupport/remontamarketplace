import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LanguageSelect } from "@/components/ui/language-select";

interface Step2AdditionalDetailsProps {
  register: any;
  control: any;
  errors: any;
  currentStep: number;
}

const Step2AdditionalDetailsComponent = function Step2AdditionalDetails({ register, control, errors, currentStep }: Step2AdditionalDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-base font-poppins font-semibold">
            Age <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="age"
            control={control}
            render={({ field }) => (
              <Input
                type="number"
                min="18"
                max="99"
                className="h-12 text-base font-poppins"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
              />
            )}
          />
          {errors.age && <p className="text-red-500 text-sm font-poppins mt-1">{errors.age.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-base font-poppins font-semibold">
            Sex Assigned at Birth <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="h-12 text-base font-poppins">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male" className="text-base font-poppins">Male</SelectItem>
                  <SelectItem value="Female" className="text-base font-poppins">Female</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.gender && <p className="text-red-500 text-sm font-poppins mt-1">{errors.gender.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-base font-poppins font-semibold">
          Languages Spoken <span className="text-red-500">*</span>
        </Label>
        <Controller
          name="languages"
          control={control}
          render={({ field }) => (
            <LanguageSelect
              value={field.value || []}
              onChange={field.onChange}
              error={errors.languages?.message}
            />
          )}
        />
      </div>
    </div>
  );
};

// Export without memoization - conditional rendering provides the optimization
export const Step2AdditionalDetails = Step2AdditionalDetailsComponent;
