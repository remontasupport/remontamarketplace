import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Step3ProfessionalProps {
  register: any;
  control: any;
  errors: any;
  currentStep: number;
}

export function Step3Professional({ register, control, errors, currentStep }: Step3ProfessionalProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-lg font-poppins font-medium">
            Title/Role <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="titleRole"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="text-lg font-poppins">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Support Worker" className="text-lg font-poppins">Support Worker</SelectItem>
                  <SelectItem value="Cleaner" className="text-lg font-poppins">Cleaner</SelectItem>
                  <SelectItem value="Gardener" className="text-lg font-poppins">Gardener</SelectItem>
                  <SelectItem value="Physiotherapist" className="text-lg font-poppins">Physiotherapist</SelectItem>
                  <SelectItem value="Occupational Therapist" className="text-lg font-poppins">Occupational Therapist</SelectItem>
                  <SelectItem value="Exercise Physiologist" className="text-lg font-poppins">Exercise Physiologist</SelectItem>
                  <SelectItem value="Psychologist" className="text-lg font-poppins">Psychologist</SelectItem>
                  <SelectItem value="Behaviour Support Practitioner" className="text-lg font-poppins">Behaviour Support Practitioner</SelectItem>
                  <SelectItem value="Social Worker" className="text-lg font-poppins">Social Worker</SelectItem>
                  <SelectItem value="Speech Pathologist" className="text-lg font-poppins">Speech Pathologist</SelectItem>
                  <SelectItem value="Personal Trainer" className="text-lg font-poppins">Personal Trainer</SelectItem>
                  <SelectItem value="Nurse (RN/EN)" className="text-lg font-poppins">Nurse (RN/EN)</SelectItem>
                  <SelectItem value="Builder" className="text-lg font-poppins">Builder</SelectItem>
                  <SelectItem value="Assistive Technology Provider" className="text-lg font-poppins">Assistive Technology Provider</SelectItem>
                  <SelectItem value="Interpreter/Translator" className="text-lg font-poppins">Interpreter/Translator</SelectItem>
                  <SelectItem value="Accommodation Provider" className="text-lg font-poppins">Accommodation Provider</SelectItem>
                  <SelectItem value="Employment Support Provider" className="text-lg font-poppins">Employment Support Provider</SelectItem>
                  <SelectItem value="Other" className="text-lg font-poppins">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.titleRole && <p className="text-red-500 text-sm font-poppins">{errors.titleRole.message}</p>}
        </div>

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
