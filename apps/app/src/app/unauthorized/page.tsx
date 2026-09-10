"use client";

/**
 * Unauthorized Page
 * Displayed when a user tries to access a route they don't have permission for
 */

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-cooper text-gray-900">
            Access Denied
          </CardTitle>
          <CardDescription className="font-poppins">
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 font-poppins text-center">
            This page is restricted to certain user roles. Please contact support if you
            believe this is an error.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="flex-1 font-poppins"
            >
              Go Back
            </Button>
            <Button
              onClick={() => router.push("/login")}
              className="flex-1 bg-[#0C1628] hover:bg-[#1a2740] font-poppins"
            >
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
