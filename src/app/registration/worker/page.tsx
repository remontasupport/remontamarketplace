'use client'

export default function WorkerRegistration() {
  return (
    <>
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
    </>
  );
}
