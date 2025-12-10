import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | Remonta NDIS Support Services',
  description: 'Get in touch with Remonta for NDIS support services. Call 1300 134 153 or email us. Our friendly team is here to help with general enquiries, accounts, support, and compliance.',
  keywords: ['contact Remonta', 'NDIS support contact', 'disability services contact', 'support worker enquiries', 'NDIS help'],
  openGraph: {
    title: 'Contact Us | Remonta NDIS Support Services',
    description: 'Contact Remonta for NDIS support services. Call our friendly team at 1300 134 153 or email us for help with your enquiry.',
    url: 'https://www.remontaservices.com.au/contact',
    siteName: 'Remonta Services',
    images: [
      {
        url: '/logo/logo-icon-dark.png',
        width: 800,
        height: 800,
        alt: 'Remonta Contact',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Contact Us | Remonta',
    description: 'Get in touch with Remonta for NDIS support services.',
    images: ['/logo/logo-icon-dark.png'],
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
