'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'

export default function ConditionalHeader() {
  const pathname = usePathname()

  // Don't render header for registration pages (they have their own layout)
  if (pathname?.startsWith('/registration')) {
    return null
  }

  // Don't render header for authentication pages
  if (pathname === '/login' || pathname === '/forgot-password' || pathname === '/reset-password') {
    return null
  }

  return <Header />
}