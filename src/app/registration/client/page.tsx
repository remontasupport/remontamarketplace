'use client'

import Header from "@/components/ui/layout/Header"
import Footer from "@/components/ui/layout/Footer"

export default function ClientRegistration() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <style jsx>{`
        iframe::-webkit-scrollbar {
          display: none;
        }
        iframe {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div style={{ height: '100vh', overflow: 'hidden' }}>
        <iframe
          aria-label='Referral & Service Request Form'
          frameBorder="0"
          scrolling="yes"
          style={{
            height: '100%',
            width: '100%',
            border: 'none'
          }}
          src='https://forms.zohopublic.com.au/remontaservices1/form/ReferralServiceRequestForm/formperma/gWcNHfxxYECG27F69e67owX2xXtXKi7qB9dGzoF2ez0'>
        </iframe>
      </div>
      <Footer />
    </div>
  );
}