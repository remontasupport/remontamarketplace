// Shown instead of the sign-up wizard when the deployment lacks the api
// configuration (lib/registration-backend.ts logs which variable). Presentational.
import { Card, CardContent } from "@/components/ui/card";

export function SignupUnavailable() {
  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardContent role="status" className="p-12 text-center space-y-4">
            <h1 className="text-3xl text-gray-900 font-cooper">Sign-up is temporarily unavailable</h1>
            <p className="text-lg text-[#0C1628] font-poppins">Please try again in a little while.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
