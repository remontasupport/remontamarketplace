'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, FileText, Clock, Users } from "lucide-react"
import Link from "next/link"

export default function RegistrationSuccess() {
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
                Thank you for joining Remonta! Your worker application has been successfully submitted to our system.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 font-poppins mb-2">
                ✅ What happens next?
              </h3>
              <ul className="space-y-2 text-green-700 font-poppins">
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Our team will review your application within 24-48 hours
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  You'll receive an email confirmation with next steps
                </li>
                <li className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Once approved, you'll be connected with potential clients
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 font-poppins mb-2">
                📧 Check your email
              </h3>
              <p className="text-blue-700 font-poppins">
                We've sent a confirmation email with important information about your application status and next steps.
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
