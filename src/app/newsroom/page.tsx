'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Footer from "@/components/ui/layout/Footer"
import { getArticles, type Article } from "@/lib/sanity/client"
import '../styles/newsroom.css'

export default function NewsroomPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch articles from Sanity
  useEffect(() => {
    async function fetchArticles() {
      try {
        const data = await getArticles()
        setArticles(data)
      } catch (error) {
        console.error('Error loading articles:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchArticles()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Articles Section */}
      <section className="articles-section">
        <div className="articles-container">
          {/* Page Header */}
          <div className="newsroom-page-header">
            <h1 className="newsroom-page-title">News and Stories</h1>
            <p className="newsroom-page-description">
              Find news, helpful tips, platform updates, and insightful stories from the Remonta community.
            </p>
          </div>

          {loading ? (
            <div className="loading-container">
              <p className="loading-text">Loading articles...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="empty-container">
              <h2 className="empty-title">
                No Articles Yet
              </h2>
              <p className="empty-description">
                We're working on bringing you the latest news and stories. Check back soon!
              </p>
              <p className="empty-note">
                To add articles, please follow the setup guide in SANITY_SETUP.md
              </p>
            </div>
          ) : (
            <>
              {/* Featured Article */}
              {articles[0] && (
                <div className="featured-article">
                  {/* Featured Image */}
                  <div className="featured-image">
                    {articles[0].imageUrl ? (
                      <Image
                        src={articles[0].imageUrl}
                        alt={articles[0].title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="image-placeholder">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Featured Content */}
                  <div className="featured-content">
                    <Link href={`/newsroom/${articles[0].slug.current}`}>
                      <h2 className="featured-title clickable-title">
                        {articles[0].title}
                      </h2>
                    </Link>
                    <p className="featured-excerpt">
                      {articles[0].excerpt}
                    </p>

                    {/* Meta Info */}
                    <div className="article-meta">
                      {articles[0].author && (
                        <div className="meta-item">
                          <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          <span>{articles[0].author}</span>
                        </div>
                      )}
                      <div className="meta-item">
                        <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span>{new Date(articles[0].publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div className="meta-item">
                        <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span>{articles[0].readTime}</span>
                      </div>
                    </div>

                    <div className="featured-button-wrapper">
                      <Link href={`/newsroom/${articles[0].slug.current}`} className="read-more-button">
                        Read more
                        <svg className="arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Article Grid */}
              <div className="article-grid">
                {articles.slice(1).map((article) => (
                  <div key={article._id} className="article-card">
                    {/* Article Image */}
                    <div className="article-image">
                      {article.imageUrl ? (
                        <Image
                          src={article.imageUrl}
                          alt={article.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="image-placeholder">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Article Content */}
                    <div className="article-content">
                      <Link href={`/newsroom/${article.slug.current}`}>
                        <h3 className="article-title clickable-title">
                          {article.title}
                        </h3>
                      </Link>

                      {/* Meta Info */}
                      <div className="article-meta-small">
                        {article.author && (
                          <div className="meta-item-small">
                            <svg className="icon-small" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            <span>{article.author}</span>
                          </div>
                        )}
                        <div className="meta-item-small">
                          <svg className="icon-small" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="meta-item-small">
                          <svg className="icon-small" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span>{article.readTime}</span>
                        </div>
                      </div>

                      <Link href={`/newsroom/${article.slug.current}`} className="article-link">
                        Read more
                        <svg className="arrow-icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Contact Information Section */}
      <section className="contact-info-section">
        <div className="contact-info-container">
          {/* Logo */}
          <div className="contact-logo">
            <Image
              src="/logo/logo-icon.svg"
              alt="Remonta Logo"
              width={60}
              height={60}
              className="contact-logo-image"
            />
          </div>

          {/* Description */}
          <div className="contact-description">
            <p>
              Remonta gives you the freedom to choose and control your support, combined with the safeguards and reliability of a NDIS-registered provider.
            </p>
          </div>

          {/* Contact Details */}
          <div className="contact-details">
            <div className="contact-item">
              <h3 className="contact-label">Phone</h3>
              <p className="contact-value">1300 134 153</p>
            </div>
            <div className="contact-item">
              <h3 className="contact-label">Email</h3>
              <p className="contact-value">contact@remontaservices.com.au</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
