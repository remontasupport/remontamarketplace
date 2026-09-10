'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

export default function CoordinatorRegistrationSuccess() {
  const router = useRouter()

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center space-y-4">
            {/* Remonta Logo */}
            <div className="flex justify-center">
              <Link href="https://www.remontaservices.com.au/">
                <Image
                  src="/logo/logo.svg"
                  alt="Remonta Logo"
                  width={180}
                  height={60}
                  priority
                  className="h-auto"
                />
              </Link>
            </div>

            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>

            <CardTitle className="text-3xl font-cooper text-gray-900">
              Registration Successful!
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-lg text-gray-600 font-poppins mb-2">
                Thank you for joining Remonta!
              </p>
              <p className="text-base text-gray-600 font-poppins">
                Your Support Coordinator account has been successfully created. You can now sign in to manage your clients and connect them with quality support workers.
              </p>
            </div>

            {/* Login Button */}
            <div className="text-center">
              <Button
                onClick={() => router.push('/login')}
                className="w-full bg-[#0C1628] hover:bg-[#1a2740] text-white font-poppins font-medium text-lg py-6"
              >
                Login here
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
