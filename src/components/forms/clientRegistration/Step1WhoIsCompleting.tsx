import { ChevronRight } from "lucide-react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { ClientFormData } from "@/schema/clientFormSchema";

interface Step1WhoIsCompletingProps {
  control: Control<ClientFormData>;
  errors: FieldErrors<ClientFormData>;
}

export function Step1WhoIsCompleting({ control, errors }: Step1WhoIsCompletingProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-poppins font-semibold text-gray-900">
          We can help you create an account in a few easy steps. Who needs support?
        </h2>
      </div>

      <Controller
        name="completingFormAs"
        control={control}
        render={({ field }) => (
          <div className="space-y-4">
            {/* Option 1: Support Coordinator */}
            <button
              type="button"
              onClick={() => field.onChange("coordinator")}
              className={`w-full p-5 rounded-lg border-2 transition-all duration-200 flex items-center justify-between text-left ${
                field.value === "coordinator"
                  ? "border-[#0C1628] bg-[#EDEFF3]"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <span className="text-base font-poppins text-gray-800">
                I am a Support Coordinator / Representative / Referrer
              </span>
              <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
            </button>

            {/* Option 2: Client/Participant */}
            <button
              type="button"
              onClick={() => field.onChange("client")}
              className={`w-full p-5 rounded-lg border-2 transition-all duration-200 flex items-center justify-between text-left ${
                field.value === "client"
                  ? "border-[#0C1628] bg-[#EDEFF3]"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <span className="text-base font-poppins text-gray-800">
                I am the Client / Participant
              </span>
              <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
            </button>
          </div>
        )}
      />

      {errors.completingFormAs && (
        <p className="text-red-500 text-sm font-poppins mt-2">
          {errors.completingFormAs.message}
        </p>
      )}
    </div>
  );
}
