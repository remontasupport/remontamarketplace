"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Your current approach requires manual if-else chains like this:
/*
const validateEmail = (email: string): string => {
  if (!email) return "Email is required";
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    return "Please enter a valid email address";
  }
  return "";
};

const validateMobile = (mobile: string): string => {
  if (!mobile) return "Mobile is required";
  const cleanMobile = mobile.replace(/\D/g, '');
  if (!(cleanMobile.length === 10 && cleanMobile.startsWith('04'))) {
    return "Please enter a valid Australian mobile number";
  }
  return "";
};
*/

// With Radix + Zod, validation becomes declarative:
const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  mobile: z.string()
    .min(1, "Mobile number is required")
    .refine((mobile) => {
      const cleanMobile = mobile.replace(/\D/g, '');
      return (
        (cleanMobile.length === 10 && cleanMobile.startsWith('04')) ||
        (cleanMobile.length === 11 && cleanMobile.startsWith('614')) ||
        (mobile.startsWith('+61') && cleanMobile.length === 11 && cleanMobile.startsWith('614'))
      );
    }, "Please enter a valid Australian mobile number (e.g., 04XX XXX XXX)"),
});

type FormData = z.infer<typeof formSchema>;

export default function FormValidationExample() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
    },
  });

  const onSubmit = (data: FormData) => {
    console.log("✅ Form valid! Data:", data);
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-bold">Radix Form Validation Example</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

          {/* First Name Field */}
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xl font-poppins font-medium">
                  First Name <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage className="text-red-500 text-sm font-poppins" />
              </FormItem>
            )}
          />

          {/* Last Name Field */}
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xl font-poppins font-medium">
                  Last Name <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage className="text-red-500 text-sm font-poppins" />
              </FormItem>
            )}
          />

          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xl font-poppins font-medium">
                  Email Address <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage className="text-red-500 text-sm font-poppins" />
              </FormItem>
            )}
          />

          {/* Mobile Field */}
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xl font-poppins font-medium">
                  Mobile Number <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="04XX XXX XXX" {...field} />
                </FormControl>
                <FormMessage className="text-red-500 text-sm font-poppins" />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>
      </Form>

      <div className="text-sm text-gray-600 space-y-2">
        <p><strong>Benefits of Radix Form Validation:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>✅ No manual if-else validation chains</li>
          <li>✅ Automatic error display with FormMessage</li>
          <li>✅ Built-in accessibility (aria-labels, error associations)</li>
          <li>✅ Type-safe with TypeScript + Zod</li>
          <li>✅ Declarative validation rules</li>
          <li>✅ Real-time validation on field blur/change</li>
          <li>✅ Consistent error styling across all fields</li>
        </ul>
      </div>
    </div>
  );
}