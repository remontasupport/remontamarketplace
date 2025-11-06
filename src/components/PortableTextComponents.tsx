import Image from 'next/image'
import Link from 'next/link'
import { PortableTextComponents } from '@portabletext/react'
import { urlFor } from '@/lib/sanity/config'

export const portableTextComponents: PortableTextComponents = {
  block: {
    h1: ({ children }) => <h1 className="text-4xl font-bold mb-4 mt-8 text-[#0C1628] font-poppins">{children}</h1>,
    h2: ({ children }) => <h2 className="text-3xl font-bold mb-4 mt-6 text-[#0C1628] font-poppins">{children}</h2>,
    h3: ({ children }) => <h3 className="text-2xl font-bold mb-3 mt-5 text-[#0C1628] font-poppins">{children}</h3>,
    h4: ({ children }) => <h4 className="text-xl font-bold mb-3 mt-4 text-[#0C1628] font-poppins">{children}</h4>,
    normal: ({ children }) => <p className="mb-6 text-base leading-relaxed text-gray-700">{children}</p>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-[#B1C3CD] pl-6 my-6 italic text-[#0C1628]">
        {children}
      </blockquote>
    ),
  },
  marks: {
    link: ({ children, value }) => {
      const rel = !value?.href?.startsWith('/') ? 'noreferrer noopener' : undefined
      return (
        <a
          href={value?.href}
          rel={rel}
          className="text-[#6B4DE6] underline hover:text-[#5a3ec7] transition-colors"
        >
          {children}
        </a>
      )
    },
    strong: ({ children }) => <strong className="font-semibold text-[#0C1628]">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="bg-[#EDEFF3] px-2 py-1 rounded text-sm font-mono text-[#0C1628]">
        {children}
      </code>
    ),
  },
  list: {
    bullet: ({ children }) => {
      console.log('Bullet list children:', children)
      return <ul className="list-disc mb-6 space-y-3 ml-6 pl-2">{children}</ul>
    },
    number: ({ children }) => {
      console.log('Number list children:', children)
      return <ol className="list-decimal mb-6 space-y-3 ml-6 pl-2">{children}</ol>
    },
  },
  listItem: {
    bullet: ({ children, value }) => {
      console.log('List item (bullet):', { children, value })
      return (
        <li className="text-gray-700 leading-relaxed mb-4">
          <div className="list-item-content">{children}</div>
        </li>
      )
    },
    number: ({ children, value }) => {
      console.log('List item (number):', { children, value })
      return (
        <li className="text-gray-700 leading-relaxed mb-4">
          <div className="list-item-content">{children}</div>
        </li>
      )
    },
  },
  types: {
    image: ({ value }) => {
      if (!value?.asset) {
        return null
      }

      const imageUrl = urlFor(value.asset)
        .width(1200)
        .height(675)
        .fit('max')
        .auto('format')
        .url()

      return (
        <div className="my-8 rounded-lg overflow-hidden">
          <Image
            src={imageUrl}
            alt={value.alt || 'Article image'}
            width={1200}
            height={675}
            className="w-full h-auto rounded-lg"
            style={{ objectFit: 'cover' }}
          />
          {value.caption && (
            <p className="text-sm text-gray-600 text-center mt-2 italic">{value.caption}</p>
          )}
        </div>
      )
    },
  },
}
