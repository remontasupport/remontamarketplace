import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'News and Stories | Remonta',
  description: 'Find news, helpful tips, platform updates, and insightful stories from the Remonta community.',
  openGraph: {
    title: 'News and Stories | Remonta',
    description: 'Find news, helpful tips, platform updates, and insightful stories from the Remonta community.',
    url: 'https://www.remontaservices.com.au/newsroom',
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
    title: 'News and Stories | Remonta',
    description: 'Find news, helpful tips, platform updates, and insightful stories from the Remonta community.',
    images: ['/logo/logo-icon-dark.png'],
  },
}

export default function NewsroomLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
