import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Step1PersonalInfoProps {
  control: any;
  errors: any;
}

export function Step1PersonalInfo({ control, errors }: Step1PersonalInfoProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-lg font-poppins font-medium">Name <span className="text-red-500">*</span></Label>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <Input
                  placeholder="First Name"
                  className="text-xl font-poppins"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                />
              )}
            />
            <p className="text-sm text-gray-600 font-poppins mt-1">First Name</p>
            {errors.firstName && <p className="text-red-500 text-sm font-poppins">{errors.firstName.message}</p>}
          </div>
          <div>
            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <Input
                  placeholder="Last Name"
                  className="text-xl font-poppins"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                />
              )}
            />
            <p className="text-sm text-gray-600 font-poppins mt-1">Last Name</p>
            {errors.lastName && <p className="text-red-500 text-sm font-poppins">{errors.lastName.message}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-lg font-poppins font-medium">
            Email <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                type="email"
                className="text-lg font-poppins"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
              />
            )}
          />
          {errors.email && <p className="text-red-500 text-sm font-poppins">{errors.email.message}</p>}
        </div>

        <div>
          <Label className="text-lg font-poppins font-medium">
            Phone <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="mobile"
            control={control}
            render={({ field }) => (
              <Input
                type="tel"
                placeholder="04XX XXX XXX"
                className="text-lg font-poppins"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
              />
            )}
          />
          {errors.mobile && <p className="text-red-500 text-sm font-poppins">{errors.mobile.message}</p>}
        </div>
      </div>

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
    </div>
  );
}
