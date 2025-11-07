import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { PortableText } from '@portabletext/react'
import Footer from "@/components/ui/layout/Footer"
import { getArticleBySlug, type Article } from "@/lib/sanity/client"
import { portableTextComponents } from "@/components/PortableTextComponents"
import ArticleClientWrapper from "@/components/ArticleClientWrapper"
import '../../styles/article.css'

// Generate dynamic metadata for SEO and social sharing
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug)

  if (!article) {
    return {
      title: 'Article Not Found | Remonta',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://remontaservices.com.au'
  const articleUrl = `${baseUrl}/newsroom/${params.slug}`

  return {
    title: `${article.title} | Remonta`,
    description: article.excerpt || article.title,
    authors: [{ name: article.author }],
    openGraph: {
      title: article.title,
      description: article.excerpt || article.title,
      url: articleUrl,
      siteName: 'Remonta',
      images: article.imageUrl ? [
        {
          url: article.imageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        }
      ] : [],
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt || article.title,
      images: article.imageUrl ? [article.imageUrl] : [],
    },
  }
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticleBySlug(params.slug)

  if (!article) {
    notFound()
  }

  return (
    <div className="article-page">
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
                    src="/logo/logo-icon.svg"
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

            {/* Share Section - Client Component */}
            <ArticleClientWrapper article={article} />
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
