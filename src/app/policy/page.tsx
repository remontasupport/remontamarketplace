import { Metadata } from 'next'
import Footer from "@/components/ui/layout/Footer"
import '@/styles/policy.css'

export const metadata: Metadata = {
  title: 'Privacy Policy | Remonta',
  description: 'Read how Remonta collects, uses, discloses, stores and protects your personal information.',
  openGraph: {
    title: 'Privacy Policy | Remonta',
    description: 'Read how Remonta collects, uses, discloses, stores and protects your personal information.',
    url: 'https://www.remontaservices.com.au/policy',
    siteName: 'Remonta',
    images: [
      {
        url: '/logo/logo-icon-dark.png',
        width: 500,
        height: 500,
        alt: 'Remonta - NDIS Service Provider Australia',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Remonta',
    description: 'Read how Remonta collects, uses, discloses, stores and protects your personal information.',
    images: ['/logo/logo-icon-dark.png'],
  },
}

const policyItems = [
  {
    title: '1. Introduction',
    text: 'Remonta respects your privacy and is committed to protecting your personal information in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs). This Privacy Policy explains how we collect, use, disclose, store and protect your information when you use our website and platform.',
  },
  {
    title: '2. Who We Are',
    text: 'Remonta is an Australian platform that connects NDIS participants, families, support coordinators and independent support professionals. We facilitate matching and communication but do not directly provide disability support services.',
  },
  {
    title: '3. Information We Collect',
    text: 'We may collect names, contact details, identity documents, verification information, NDIS-related information, payment details, profile information, communications, website usage data, device information and any information you voluntarily provide.',
  },
  {
    title: '4. How We Collect Information',
    text: 'Information is collected when you register, complete forms, upload documents, contact us, communicate through the platform, use our website, or from authorised third parties such as verification providers.',
  },
  {
    title: '5. How We Use Information',
    text: 'We use information to create accounts, verify identities, match participants with providers, process payments, communicate with users, improve services, maintain platform security, comply with legal obligations and send marketing where permitted.',
  },
  {
    title: '6. Verification',
    text: 'Support workers may be asked to provide identity documents, NDIS Worker Screening, Working With Children Check, qualifications and other compliance documentation.',
  },
  {
    title: '7. Sharing Information',
    text: 'We may share information with users you choose to connect with, payment processors, technology providers, verification providers, professional advisers, regulators where required by law, and trusted overseas service providers under appropriate safeguards. We do not sell personal information.',
  },
  {
    title: '8. Cookies',
    text: 'We use cookies and analytics technologies to improve website functionality, understand usage and personalise your experience.',
  },
  {
    title: '9. Data Security',
    text: 'We use reasonable administrative, technical and physical safeguards to protect personal information from unauthorised access, loss or misuse.',
  },
  {
    title: '10. Overseas Disclosure',
    text: 'Some service providers may process information outside Australia. We take reasonable steps to ensure appropriate privacy protections are maintained.',
  },
  {
    title: '11. Access and Correction',
    text: 'You may request access to or correction of your personal information by contacting us.',
  },
  {
    title: '12. Retention',
    text: 'Information is retained only as long as necessary for legal, regulatory and business purposes.',
  },
  {
    title: '13. Marketing',
    text: 'You may opt out of marketing emails at any time using the unsubscribe link or by contacting us.',
  },
  {
    title: '14. Complaints',
    text: 'Privacy complaints may be submitted to Remonta. If unresolved, you may contact the Office of the Australian Information Commissioner (OAIC).',
  },
  {
    title: '15. Changes',
    text: 'We may update this Privacy Policy from time to time. Updated versions will be published on our website.',
  },
]

export default function PolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="policy-section">
        <div className="policy-container">
          <div className="policy-page-header">
            <h1 className="policy-page-title">Privacy Policy</h1>
            <p className="policy-effective-date">Effective Date: June 1, 2025</p>
          </div>

          <div className="policy-content">
            {policyItems.map((item) => (
              <div key={item.title} className="policy-item">
                <h2 className="policy-item-title">{item.title}</h2>
                <p className="policy-item-text">{item.text}</p>
              </div>
            ))}

            <div className="policy-item">
              <h2 className="policy-item-title">16. Contact Us</h2>
              <ul className="policy-contact-list">
                <li>Email: <a href="mailto:contact@remontaservices.com.au">contact@remontaservices.com.au</a></li>
                <li>Phone: <a href="tel:1300134153">1300 134 153</a></li>
                <li>Website: <a href="https://www.remontaservices.com.au/" target="_blank" rel="noopener noreferrer">https://www.remontaservices.com.au/</a></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
