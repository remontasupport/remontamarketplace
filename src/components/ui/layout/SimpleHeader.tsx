'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function SimpleHeader() {
  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="mx-auto flex max-w-7xl items-center py-4 px-4 lg:px-8" aria-label="Global">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="sr-only">LocalAid</span>
            <div className="flex flex-col items-start">
              <Image
                className="h-8 w-auto"
                src="/logo/logo.svg"
                alt="LocalAid"
                width={160}
                height={32}
                priority
              />
              <span className="text-xs mt-0.5 italic text-gray-500 ml-8">
                previously Remonta
              </span>
            </div>
          </Link>
        </div>
      </nav>
    </header>
  )
}