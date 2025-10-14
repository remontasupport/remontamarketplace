'use client'

import Header from "@/components/ui/layout/Header"

export default function ClientRegistration() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <style jsx global>{`
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
        iframe * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        iframe *::-webkit-scrollbar {
          display: none !important;
        }
      `}</style>
      <div style={{ height: '150vh', overflow: 'hidden' }}>
        <iframe
          aria-label='Support Coordinator Network Form'
          frameBorder="0"
          scrolling="yes"
          style={{
            height: '100%',
            width: '100%',
            border: 'none'
          }}
          src='https://forms.zohopublic.com.au/remontaservices1/form/SupportCoordinatorNetworkForm/formperma/4lS_VaGPsN2amBoXXnxwdLqE-deT5sVXOBeW9P-V2S8'>
        </iframe>
      </div>
      {/* <Footer /> */}
    </div>
  );
}