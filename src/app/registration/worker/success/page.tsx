'use client'

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, FileText, Clock, Users } from "lucide-react"
import Link from "next/link"

export default function RegistrationSuccess() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  // Auto-redirect to verification code page after 3 seconds
  useEffect(() => {
    if (email) {
      const timer = setTimeout(() => {
        router.push(`/auth/verify-code?email=${encodeURIComponent(email)}`)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [email, router])
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-cooper text-gray-900">
              Registration Successful!
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-lg text-gray-600 font-poppins">
                Thank you for joining Remonta! Your worker application has been successfully submitted.
              </p>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 font-poppins mb-2 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                ⚠️ Important: Verify Your Email
              </h3>
              <p className="text-yellow-800 font-poppins mb-3">
                We've sent a 6-digit verification code to your email. You must verify your email address before you can log in.
              </p>
              <ul className="space-y-2 text-yellow-800 font-poppins text-sm list-disc list-inside">
                <li>Check your email (including spam/junk folder)</li>
                <li>Enter the 6-digit code on the next page</li>
                <li>Once verified, you can log in to your account</li>
              </ul>
              {email && (
                <div className="mt-4">
                  <Button
                    onClick={() => router.push(`/auth/verify-code?email=${encodeURIComponent(email)}`)}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    Enter Verification Code Now
                  </Button>
                </div>
              )}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 font-poppins mb-2">
                ✅ What happens next?
              </h3>
              <ol className="space-y-2 text-green-700 font-poppins list-decimal list-inside">
                <li>
                  <strong>Verify your email</strong> (check your inbox now)
                </li>
                <li>
                  <strong>Log in to your dashboard</strong>
                </li>
                <li>
                  <strong>Complete verification</strong> (upload required documents like police check, WWCC, etc.)
                </li>
                <li>
                  <strong>Get approved</strong> and start connecting with clients!
                </li>
              </ol>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 font-poppins mb-2">
                📧 Didn't receive the email?
              </h3>
              <p className="text-blue-700 font-poppins text-sm">
                Check your spam folder, or contact our support team for assistance.
              </p>
            </div>

            <div className="text-center space-y-4">
              <p className="text-gray-600 font-poppins">
                Have questions? Contact our support team anytime.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="bg-[#0C1628] hover:bg-[#1a2740] text-white">
                  <Link href="/">
                    Return to Home
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>

                <Button variant="outline" asChild>
                  <Link href="/support">
                    Contact Support
                  </Link>
                </Button>
              </div>
            </div>

            <div className="text-center text-sm text-gray-500 font-poppins">
              Application submitted on {new Date().toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}