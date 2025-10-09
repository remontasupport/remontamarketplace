'use client'

import { useState } from 'react'
import Header from "@/components/ui/layout/Header"
import Footer from "@/components/ui/layout/Footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function WorkerRegistration() {
  const [showWelcome, setShowWelcome] = useState(true)

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="bg-gray-50 min-h-screen py-8">
          <div className="max-w-2xl mx-auto px-4">
            <Card>
              <CardContent className="p-12 text-center space-y-6">
                <div className="space-y-6">
                  <h1 className="text-4xl text-gray-900 font-cooper">
                    Welcome to Remonta
                  </h1>
                  <div className="bg-[#EDEFF3] rounded-lg p-6 text-left max-w-lg mx-auto">
                    <p className="text-lg text-[#0C1628] font-poppins mb-4">
                      Your profile will play a key role in connecting you with clients who are looking for high-quality services.
                    </p>

                     <p className="text-lg text-[#0C1628] font-poppins mb-4">
                      To help clients choose you, it’s essential to create a strong, professional profile that showcases your skills, experience, and commitment to excellence.
                    </p>
                  
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={() => setShowWelcome(false)}
                    className="bg-[#0C1628] hover:bg-[#A3DEDE] text-white px-8 py-3 text-lg font-poppins font-medium rounded-lg transition-colors duration-200 border-0"
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <style jsx>{`
        iframe::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        iframe {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
          overflow: -moz-scrollbars-none !important;
        }
      `}</style>
      <div style={{ height: '150vh', overflow: 'hidden' }}>
        <iframe
          aria-label='Remonta - Profile Submission'
          frameBorder="0"
          allow="camera;"
          scrolling="yes"
          style={{
            height: '100%',
            width: '100%',
            border: 'none'
          }}
          src='https://forms.zohopublic.com.au/remontaservices1/form/ProfileSubmission/formperma/3FHPymU7Ch_tGMS79a3xgZgSw98Zx83NRDDxlE70MZo?zf_enablecamera=true'>
        </iframe>
      </div>
      {/* <Footer /> */}
    </div>
  );
}
