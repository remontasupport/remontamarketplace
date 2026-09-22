'use client'

import { useEffect } from 'react'

interface ArticleMetaTagsProps {
  title: string
  description: string
  imageUrl?: string
  url: string
  author: string
  publishedAt: string
}

export default function ArticleMetaTags({
  title,
  description,
  imageUrl,
  url,
  author,
  publishedAt
}: ArticleMetaTagsProps) {
  useEffect(() => {
    // Update document title
    document.title = `${title} | Remonta`

    // Create or update meta tags
    const updateMetaTag = (property: string, content: string, isName = false) => {
      const attribute = isName ? 'name' : 'property'
      let element = document.querySelector(`meta[${attribute}="${property}"]`)

      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attribute, property)
        document.head.appendChild(element)
      }

      element.setAttribute('content', content)
    }

    // Open Graph tags for Facebook, LinkedIn
    updateMetaTag('og:title', title)
    updateMetaTag('og:description', description)
    updateMetaTag('og:url', url)
    updateMetaTag('og:type', 'article')
    updateMetaTag('og:site_name', 'Remonta')

    if (imageUrl) {
      updateMetaTag('og:image', imageUrl)
      updateMetaTag('og:image:width', '1200')
      updateMetaTag('og:image:height', '630')
      updateMetaTag('og:image:alt', title)
    }

    // Article specific tags
    updateMetaTag('article:published_time', publishedAt)
    updateMetaTag('article:author', author)

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image', true)
    updateMetaTag('twitter:title', title, true)
    updateMetaTag('twitter:description', description, true)

    if (imageUrl) {
      updateMetaTag('twitter:image', imageUrl, true)
      updateMetaTag('twitter:image:alt', title, true)
    }

    // Standard meta tags
    updateMetaTag('description', description, true)
    updateMetaTag('author', author, true)

    // Cleanup function (optional, but good practice)
    return () => {
      // We don't remove meta tags on unmount to avoid flicker
      // They'll be updated when navigating to another article
    }
  }, [title, description, imageUrl, url, author, publishedAt])

  return null // This component doesn't render anything
}
