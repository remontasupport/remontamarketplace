"use client";

/**
 * Login Page
 *
 * Handles authentication for all user types (Worker, Client, Coordinator)
 * Automatically redirects to the appropriate dashboard based on user role
 */

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { getRedirectPathForRole } from "@/types/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Attempt to sign in
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false, // We handle redirect manually
      });

      if (result?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      // Fetch the session to get user role
      const response = await fetch("/api/auth/session");
      const session = await response.json();

      if (session?.user?.role) {
        // Redirect based on role
        const redirectPath = getRedirectPathForRole(session.user.role);
        console.log("✅ Login successful! Redirecting to:", redirectPath);
        router.push(redirectPath);
        router.refresh();
      } else {
        setError("Unable to determine user role");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-cooper text-gray-900 text-center">
            Welcome back
          </CardTitle>
          <CardDescription className="text-center font-poppins">
            Sign in to your Remonta account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-poppins">{error}</AlertDescription>
              </Alert>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-poppins font-semibold">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="font-poppins"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-base font-poppins font-semibold">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  className="text-sm text-blue-600 hover:text-blue-700 font-poppins font-medium"
                  disabled={isLoading}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="font-poppins pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-[#0C1628] hover:bg-[#1a2740] text-white font-poppins font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500 font-poppins">
                  Don't have an account?
                </span>
              </div>
            </div>

            {/* Registration Links */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600 font-poppins text-center">
                Register as:
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 font-poppins"
                  onClick={() => router.push("/registration/worker")}
                  disabled={isLoading}
                >
                  Worker
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 font-poppins"
                  onClick={() => router.push("/registration/client")}
                  disabled={isLoading}
                >
                  Client
                </Button>
                {/* Coordinator registration temporarily disabled */}
                {/* <Button
                  type="button"
                  variant="outline"
                  className="flex-1 font-poppins text-xs"
                  onClick={() => router.push("/registration/support-coordinator")}
                  disabled={isLoading}
                >
                  Coordinator
                </Button> */}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
