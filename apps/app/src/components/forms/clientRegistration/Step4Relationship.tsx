import { Control, Controller, FieldErrors } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientFormData } from "@/schema/clientFormSchema";

interface Step4RelationshipProps {
  control: Control<ClientFormData>;
  errors: FieldErrors<ClientFormData>;
}

export function Step4Relationship({ control, errors }: Step4RelationshipProps) {
  const relationshipOptions = [
    { value: "self", label: "Self" },
    { value: "parent", label: "Parent" },
    { value: "legal-guardian", label: "Legal Guardian" },
    { value: "spouse-partner", label: "Spouse/Partner" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-poppins font-semibold text-gray-900 mb-6">
          Relationship to Client/Participant
        </h2>

        <div className="space-y-2">
          <Label className="text-base font-poppins font-semibold text-gray-900">
            Select your relationship <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="relationshipToClient"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="h-12 text-base font-poppins">
                  <SelectValue placeholder="Select relationship" />
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
            )}
          />
          {errors.relationshipToClient && (
            <p className="text-red-500 text-sm font-poppins mt-1">
              {errors.relationshipToClient.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
