'use client';

import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Control, FieldErrors } from "react-hook-form";
import { ClientFormData } from "@/schema/clientFormSchema";
import { EXPERIENCE_AREAS } from "@/components/profile-building/sections/ExperienceSection";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, Check } from "lucide-react";
import DatePickerField from "@/components/forms/fields/DatePickerFieldV2";

interface Step2PersonalInfoProps {
  control: Control<ClientFormData>;
  errors: FieldErrors<ClientFormData>;
  completingFormAs?: string;
}

export function Step2PersonalInfo({ control, errors, completingFormAs }: Step2PersonalInfoProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-poppins font-semibold text-gray-900">Please provide your details</h2>

      {/* First Name */}
      <div>
        <Label className="text-base font-poppins font-semibold text-gray-900">
          First name
        </Label>
        <Controller
          name="firstName"
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
        {errors.firstName && <p className="text-red-500 text-sm font-poppins mt-1">{errors.firstName.message}</p>}
      </div>

      {/* Last Name */}
      <div>
        <Label className="text-base font-poppins font-semibold text-gray-900">
          Last name
        </Label>
        <Controller
          name="lastName"
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
        {errors.lastName && <p className="text-red-500 text-sm font-poppins mt-1">{errors.lastName.message}</p>}
      </div>

      {/* Date of Birth - Only shown for Self-managed clients */}
      {completingFormAs === "self" && (
        <Controller
          name="dateOfBirth"
          control={control}
          render={({ field }) => (
            <DatePickerField
              label="Date of birth"
              name="dateOfBirth"
              value={field.value || ""}
              onChange={field.onChange}
              error={errors.dateOfBirth?.message}
              required
            />
          )}
        />
      )}

      {/* Phone Number */}
      <div>
        <Label className="text-base font-poppins font-semibold text-gray-900">
          Phone number
        </Label>
        <p className="text-sm text-gray-600 font-poppins mt-1">
          e.g. 0412 345 678
        </p>
        <Controller
          name="phoneNumber"
          control={control}
          render={({ field }) => (
            <Input
              type="tel"
              placeholder=""
              className="text-base font-poppins mt-2"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
            />
          )}
        />
        {errors.phoneNumber && <p className="text-red-500 text-sm font-poppins mt-1">{errors.phoneNumber.message}</p>}
      </div>

      {/* Organisation Name - Only shown for Support Coordinators */}
      {completingFormAs === "coordinator" && (
        <div>
          <Label className="text-base font-poppins font-semibold text-gray-900">
            Organisation name
          </Label>
          <p className="text-sm text-gray-600 font-poppins mt-1">
            Optional
          </p>
          <Controller
            name="organisationName"
            control={control}
            render={({ field }) => (
              <Input
                placeholder=""
                className="text-base font-poppins mt-2"
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
              />
            )}
          />
        </div>
      )}

      {/* Client Types Dropdown - Only shown for Support Coordinators */}
      {completingFormAs === "coordinator" && (
        <div>
          <Label className="text-base font-poppins font-semibold text-gray-900">
            What type of clients do you service?
          </Label>
          <Controller
            name="clientTypes"
            control={control}
            render={({ field }) => {
              const selectedValues = field.value || [];
              const selectedLabels = EXPERIENCE_AREAS
                .filter(area => selectedValues.includes(area.id))
                .map(area => area.label);

              const handleToggle = (id: string) => {
                const current = field.value || [];
                if (current.includes(id)) {
                  field.onChange(current.filter((v: string) => v !== id));
                } else {
                  field.onChange([...current, id]);
                }
              };

              return (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 mt-2"
                    >
                      <span className={selectedLabels.length > 0 ? "text-gray-900 truncate" : "text-gray-500"}>
                        {selectedLabels.length > 0
                          ? selectedLabels.join(", ")
                          : "Select client types"}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-2" align="start" side="bottom" avoidCollisions={false} sideOffset={4}>
                    <div className="space-y-1">
                      {EXPERIENCE_AREAS.map((area) => (
                        <button
                          key={area.id}
                          type="button"
                          onClick={() => handleToggle(area.id)}
                          className="flex items-center w-full px-2 py-2 text-sm rounded hover:bg-gray-100 transition-colors"
                        >
                          <div className={`w-4 h-4 border rounded mr-2 flex items-center justify-center ${
                            selectedValues.includes(area.id)
                              ? "bg-[#0C1628] border-[#0C1628]"
                              : "border-gray-300"
                          }`}>
                            {selectedValues.includes(area.id) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className="text-gray-700">{area.label}</span>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              );
            }}
          />
          {errors.clientTypes && <p className="text-red-500 text-sm font-poppins mt-1">{errors.clientTypes.message}</p>}
        </div>
      )}
    </div>
  );
}
