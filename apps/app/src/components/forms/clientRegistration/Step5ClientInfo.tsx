'use client';

import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Control, FieldErrors } from "react-hook-form";
import { ClientFormData } from "@/schema/clientFormSchema";
import DatePickerField from "@/components/forms/fields/DatePickerFieldV2";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const RELATIONSHIP_OPTIONS = [
  { value: "parent", label: "Parent" },
  { value: "legal-guardian", label: "Legal Guardian" },
  { value: "spouse-partner", label: "Spouse/Partner" },
  { value: "children", label: "Child" },
  { value: "myself", label: "My Self" },
  { value: "other", label: "Other" },
];

interface Step5ClientInfoProps {
  control: Control<ClientFormData>;
  errors: FieldErrors<ClientFormData>;
  showAddMoreNote?: boolean;
  mode?: "client" | "self";
}

export function Step5ClientInfo({ control, errors, showAddMoreNote, mode = "client" }: Step5ClientInfoProps) {
  const isSelf = mode === "self";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-poppins font-semibold text-gray-900">
          About the person needing support
        </h2>
        {showAddMoreNote && (
          <p className="text-sm text-gray-600 font-poppins mt-2">
            You can add more clients to your profile later.
          </p>
        )}
      </div>

      {/* Relationship to Client - only shown for self path */}
      {isSelf && (
        <div className="space-y-2">
          <Label className="text-base font-poppins font-semibold text-gray-900">
            Relationship to Client <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="relationshipToClient"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-12 text-base font-poppins">
                    <SelectValue placeholder="Select your relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-base font-poppins"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.isTouched && fieldState.error && (
                  <p className="text-red-500 text-sm font-poppins mt-1">
                    {fieldState.error.message}
                  </p>
                )}
              </>
            )}
          />
        </div>
      )}

      {/* First Name */}
      <div>
        <Label className="text-base font-poppins font-semibold text-gray-900">
          First name
        </Label>
        <Controller
          name="clientFirstName"
          control={control}
          render={({ field }) => (
            <Input
              placeholder=""
              className="text-base font-poppins mt-2"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
            />
          )}
        />
        {errors.clientFirstName && <p className="text-red-500 text-sm font-poppins mt-1">{errors.clientFirstName.message}</p>}
      </div>

      {/* Last Name */}
      <div>
        <Label className="text-base font-poppins font-semibold text-gray-900">
          Last name
        </Label>
        <Controller
          name="clientLastName"
          control={control}
          render={({ field }) => (
            <Input
              placeholder=""
              className="text-base font-poppins mt-2"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
            />
          )}
        />
        {errors.clientLastName && <p className="text-red-500 text-sm font-poppins mt-1">{errors.clientLastName.message}</p>}
      </div>

      {/* Date of Birth */}
      <Controller
        name="clientDateOfBirth"
        control={control}
        render={({ field }) => (
          <DatePickerField
            label="Date of birth"
            name="clientDateOfBirth"
            value={field.value || ""}
            onChange={field.onChange}
            error={errors.clientDateOfBirth?.message}
            required
          />
        )}
      />

    </div>
  );
}
