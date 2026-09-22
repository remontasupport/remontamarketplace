'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function SimpleHeader() {
  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="mx-auto flex max-w-7xl items-center px-4 lg:px-8" aria-label="Global">
        {/* Simple header without logo */}
      </nav>
    </header>
  )
}