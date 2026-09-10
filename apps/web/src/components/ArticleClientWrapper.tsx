'use client'

import { useState } from 'react'
import { Article } from '@/lib/sanity/client'

interface ArticleClientWrapperProps {
  article: Article
}

export default function ArticleClientWrapper({ article }: ArticleClientWrapperProps) {
  const [copySuccess, setCopySuccess] = useState(false)

  const handleShare = async (platform: string) => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const title = article?.title || ''
    const description = article?.excerpt || ''

    const shareUrls: { [key: string]: string } = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    }

    if (platform === 'copy') {
      navigator.clipboard.writeText(url)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } else if (platform === 'instagram') {
      // Instagram sharing works best on mobile via Web Share API
      if (navigator.share) {
        try {
          await navigator.share({
            title: title,
            text: description,
            url: url
          })
        } catch (error) {
          // User cancelled or error occurred
          if ((error as Error).name !== 'AbortError') {
            // Fallback: Copy link and show instructions
            navigator.clipboard.writeText(url)
            alert('Link copied! Open Instagram app and paste the link in your story or post.')
          }
        }
      } else {
        // Desktop fallback: Copy link with instructions
        navigator.clipboard.writeText(url)
        alert('Link copied! Open Instagram app on your phone and paste the link in your story or post.')
      }
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400')
    }
  }

  return (
    <div className="share-section">
      <span className="share-label">Share Post:</span>
      <div className="share-buttons">
        <button
          className="share-button facebook"
          onClick={() => handleShare('facebook')}
        >
          Facebook
        </button>
        <button
          className="share-button twitter"
          onClick={() => handleShare('twitter')}
        >
          Twitter
        </button>
        <button
          className="share-button linkedin"
          onClick={() => handleShare('linkedin')}
        >
          LinkedIn
        </button>
        <button
          className="share-button instagram"
          onClick={() => handleShare('instagram')}
        >
          Instagram
        </button>
        <button
          className="share-button copy-link"
          onClick={() => handleShare('copy')}
        >
          {copySuccess ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    </div>
  )
}
