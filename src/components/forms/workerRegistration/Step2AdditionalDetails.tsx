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

export function Step2AdditionalDetails({ register, control, errors, currentStep }: Step2AdditionalDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-lg font-poppins font-medium">
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
                className="text-lg font-poppins"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
              />
            )}
          />
          {errors.age && <p className="text-red-500 text-sm font-poppins">{errors.age.message}</p>}
        </div>

        <div>
          <Label className="text-md font-poppins font-medium">
            What sex were you assigned at birth? <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="text-lg font-poppins">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male" className="text-lg font-poppins">Male</SelectItem>
                  <SelectItem value="Female" className="text-lg font-poppins">Female</SelectItem>
                  <SelectItem value="Other" className="text-lg font-poppins">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.gender && <p className="text-red-500 text-sm font-poppins">{errors.gender.message}</p>}
        </div>
      </div>

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
}
