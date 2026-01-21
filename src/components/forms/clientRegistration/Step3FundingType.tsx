import { Control, Controller, FieldErrors } from "react-hook-form";
import { ClientFormData } from "@/schema/clientFormSchema";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Step3FundingTypeProps {
  control: Control<ClientFormData>;
  errors?: FieldErrors<ClientFormData>;
  showRelationship?: boolean;
}

export function Step3FundingType({ control, showRelationship = true }: Step3FundingTypeProps) {
  const fundingOptions = [
    { value: "ndis", label: "NDIS Participant (has an active NDIS plan)" },
    { value: "aged-care", label: "Aged Care Recipient" },
    { value: "insurance", label: "Insurance-Funded Client (e.g. TAC, iCare, WorkCover)" },
    { value: "private", label: "Private (self-funded) Client" },
    { value: "other", label: "Other" },
  ];

  const relationshipOptions = [
    { value: "parent", label: "Parent" },
    { value: "legal-guardian", label: "Legal Guardian" },
    { value: "spouse-partner", label: "Spouse/Partner" },
    { value: "children", label: "Children" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-poppins font-semibold text-gray-900">
        About the person needing support
      </h2>

      {/* Relationship to Client - only shown when assisting someone else */}
      {showRelationship && (
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
                    {relationshipOptions.map((option) => (
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

      {/* Funding Type */}
      <div className={`space-y-2 ${showRelationship ? 'pt-4' : ''}`}>
        <Label className="text-base font-poppins font-semibold text-gray-900">
          Funding Type <span className="text-red-500">*</span>
        </Label>
        <Controller
          name="fundingType"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <div className="space-y-3">
                {fundingOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      field.value === option.value
                        ? "border-[#0C1628] bg-[#EDEFF3]"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      className="w-5 h-5 text-[#0C1628] border-gray-300 focus:ring-[#0C1628] cursor-pointer"
                      value={option.value}
                      checked={field.value === option.value}
                      onChange={() => field.onChange(option.value)}
                    />
                    <span className="ml-3 text-base font-poppins text-gray-800">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
              {fieldState.isTouched && fieldState.error && (
                <p className="text-red-500 text-sm font-poppins mt-2">
                  {fieldState.error.message}
                </p>
              )}
            </>
          )}
        />
      </div>
    </div>
  );
}
