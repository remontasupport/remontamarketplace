'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { PortableText } from '@portabletext/react'
import Footer from "@/components/ui/layout/Footer"
import ArticleMetaTags from "@/components/ArticleMetaTags"
import { getArticleBySlug, type Article } from "@/lib/sanity/client"
import { portableTextComponents } from "@/components/PortableTextComponents"
import '../../styles/article.css'

export default function ArticlePage() {
  const params = useParams()
  const slug = params?.slug as string
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    async function fetchArticle() {
      try {
        if (slug) {
          const data = await getArticleBySlug(slug)
          setArticle(data)
        }
      } catch (error) {
        console.error('Error loading article:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchArticle()
  }, [slug])

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

  if (loading) {
    return (
      <div className="article-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="article-page">
        <div className="error-state">
          <div className="error-message">
            <h1>Article not found</h1>
            <p>The article you're looking for doesn't exist or has been removed.</p>
            <Link href="/newsroom" className="back-link">
              Back to Newsroom
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Get full URL for meta tags
  const fullUrl = typeof window !== 'undefined' ? window.location.href : ''

  return (
    <div className="article-page">
      {/* Dynamic Meta Tags for Social Sharing */}
      <ArticleMetaTags
        title={article.title}
        description={article.excerpt || article.title}
        imageUrl={article.imageUrl}
        url={fullUrl}
        author={article.author}
        publishedAt={article.publishedAt}
      />

      <div className="article-container">
        <div className="article-layout">
          {/* Main Content */}
          <div className="article-main">
            <div className="article-header">
              <h1 className="article-title">{article.title}</h1>

              <p className="article-date">
                {new Date(article.publishedAt).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>

              <div className="article-author">
                <div className="author-logo">
                  <Image
                    src="/images/logo_dark.webp"
                    alt="Remonta Logo"
                    width={48}
                    height={48}
                    className="object-contain"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                </div>
                <div className="author-info">
                  <span className="author-name">Written by {article.author}</span>
                  <span className="author-category">News</span>
                </div>
              </div>
            </div>

            {/* Article Body */}
            <div className="article-body">
              {article.body && (
                <PortableText
                  value={article.body}
                  components={portableTextComponents}
                />
              )}
            </div>

            {/* Share Section */}
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
          </div>

          {/* Sidebar */}
          <aside className="article-sidebar">
            <div className="article-sidebar-sticky">
              <div className="sidebar-card">
                <h3 className="sidebar-title">New to Remonta?</h3>

                <div className="sidebar-image">
                  <Image
                    src="/images/support-hero.jpg"
                    alt="Remonta Support"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
                    className="object-cover"
                  />
                </div>

                <p className="sidebar-description">
                  Remonta is an NDIS registered online platform for people with disability to find, hire and manage support workers who match their needs and share their interests.
                </p>

                <div className="sidebar-buttons">
                  <Link href="/find-support" className="sidebar-button primary">
                    Find support
                  </Link>
                  <Link href="/provide-support" className="sidebar-button secondary">
                    Provide support
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  )
}
