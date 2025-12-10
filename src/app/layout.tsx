import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import ConditionalHeader from "@/components/ui/layout/ConditionalHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Remonta | NDIS Service Provider Australia | Trusted NDIS Support Work",
  description: "Connecting NDIS participants with quality support workers across Australia",
  metadataBase: new URL('https://www.remontaservices.com.au'),
  verification: {
    google: 'pkvtMiFCtvuWhEd32fXDKjtML0IybbTSGZontVmXDCE',
  },
  openGraph: {
    title: "Remonta | NDIS Service Provider Australia | Trusted NDIS Support Work",
    description: "Connecting NDIS participants with quality support workers across Australia",
    url: 'https://www.remontaservices.com.au',
    siteName: 'Remonta Services',
    images: [
      {
        url: '/logo/logo-icon-dark.png',
        width: 500,
        height: 500,
        alt: 'Remonta - NDIS Service Provider Australia',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Remonta | NDIS Service Provider Australia | Trusted NDIS Support Work",
    description: "Connecting NDIS participants with quality support workers across Australia",
    images: ['/logo/logo-icon-dark.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/logo/logo-icon-dark.png', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/logo/logo-icon-dark.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = 'https://www.remontaservices.com.au'

  // Sitelinks Search Box schema
  const sitelinksSearchBoxSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": siteUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}/search-workers?query={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  }

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Remonta Services",
    "alternateName": "Remonta",
    "url": "https://www.remontaservices.com.au",
    "logo": "https://www.remontaservices.com.au/logo/logo-icon-dark.png",
    "description": "NDIS registered service provider connecting participants with quality support workers across Australia",
    "telephone": "+61-1300-134-153",
    "email": "contact@remontaservices.com.au",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "AU",
      "addressRegion": "Australia"
    },
    "areaServed": [
      {
        "@type": "State",
        "name": "Queensland"
      },
      {
        "@type": "State",
        "name": "Victoria"
      },
      {
        "@type": "State",
        "name": "Western Australia"
      },
      {
        "@type": "State",
        "name": "New South Wales"
      }
    ],
    "sameAs": [
      "https://www.facebook.com/remontaservices",
      "https://www.linkedin.com/company/remontaservices",
      "https://www.instagram.com/remontaservices"
    ],
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "telephone": "+61-1300-134-153",
        "contactType": "customer service",
        "areaServed": "AU",
        "availableLanguage": ["English"]
      },
      {
        "@type": "ContactPoint",
        "email": "contact@remontaservices.com.au",
        "contactType": "general enquiries"
      },
      {
        "@type": "ContactPoint",
        "email": "support@remontaservices.com.au",
        "contactType": "customer support"
      }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "NDIS Support Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Support Work",
            "description": "Personal care, daily living assistance, and community support"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Nursing Services",
            "description": "Professional nursing and specialized care"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Therapeutic Support",
            "description": "Allied health therapies including OT, physiotherapy, and psychology"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Home Modifications",
            "description": "Accessibility improvements and home modifications"
          }
        }
      ]
    }
  }

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(sitelinksSearchBoxSchema) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased`}
      >
        <ConditionalHeader />
        {children}
      </body>
    </html>
  );
}
