import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import ConditionalHeader from "@/components/ui/layout/ConditionalHeader";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { QueryClientProvider } from "@/components/providers/QueryClientProvider";
import { ProgressProvider } from "@/contexts/ProgressContext";
import ProgressBar from "@/components/ui/ProgressBar";
import ApiInterceptorSetup from "@/components/ApiInterceptorSetup";

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
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased`}
      >
        <ProgressProvider>
          <ProgressBar />
          <ApiInterceptorSetup />
          <SessionProvider>
            <QueryClientProvider>
              <ConditionalHeader />
              {children}
            </QueryClientProvider>
          </SessionProvider>
        </ProgressProvider>
      </body>
    </html>
  );
}
