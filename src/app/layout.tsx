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
  title: "Find Support Workers for Disability",
  description: "Connecting NDIS participants with quality support workers across Australia",
  metadataBase: new URL('https://www.remontaservices.com.au'),
  openGraph: {
    title: "Find Support Workers for Disability",
    description: "Connecting NDIS participants with quality support workers across Australia",
    url: 'https://www.remontaservices.com.au',
    siteName: 'Remonta Services',
    images: [
      {
        url: '/hero-image.png',
        width: 1200,
        height: 630,
        alt: 'Remonta Services - Find Support Workers',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Find Support Workers for Disability",
    description: "Connecting NDIS participants with quality support workers across Australia",
    images: ['/hero-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/logo/logo-icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/logo/logo-icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased`}
      >
        <ConditionalHeader />
        {children}
      </body>
    </html>
  );
}
