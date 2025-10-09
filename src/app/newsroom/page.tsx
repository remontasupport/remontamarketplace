'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Header from "@/components/ui/layout/Header"
import Footer from "@/components/ui/layout/Footer"
import { Button } from "@/components/ui/button"
import { BRAND_COLORS } from "@/lib/constants"
import { getArticles, type Article } from "@/lib/sanity/client"

export default function NewsroomPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage('')

    try {
      // Add your newsletter subscription logic here
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulated API call
      setSubmitMessage('Thank you for subscribing!')
      setEmail('')
    } catch (error) {
      setSubmitMessage('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">


      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden" style={{ backgroundColor: BRAND_COLORS.HIGHLIGHT }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl text-black font-cooper">
              News and Stories
            </h1>
            <p className="font-poppins text-xl">Find news, helpful tips, platform updates, and insightful stories from the Remonta community.</p>
            {/* Newsletter Subscription Card */}
            <div className="max-w-md mx-auto mt-12">
              <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-black font-poppins">
                    Subscribe Our Weekly Newsletter
                  </h2>
                  <p className="font-poppins text-sm">
                    Regular updates ensure that readers have access to fresh perspectives, making Remonta a must-read.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-opacity-50 font-cooper"

                      disabled={isSubmitting}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full text-white py-3 rounded-lg font-cooper font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                    style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = BRAND_COLORS.SECONDARY
                      e.currentTarget.style.color = BRAND_COLORS.PRIMARY
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = BRAND_COLORS.PRIMARY
                      e.currentTarget.style.color = 'white'
                    }}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                    {!isSubmitting && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </Button>

                  {submitMessage && (
                    <p className={`text-sm font-cooper text-center ${submitMessage.includes('Thank you') ? 'text-green-600' : 'text-red-600'}`}>
                      {submitMessage}
                    </p>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Articles Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-20">
              <p className="text-gray-500 font-poppins">Loading articles...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-3xl font-bold font-poppins mb-4" style={{ color: BRAND_COLORS.PRIMARY }}>
                No Articles Yet
              </h2>
              <p className="text-gray-600 font-poppins mb-6">
                We're working on bringing you the latest news and stories. Check back soon!
              </p>
              <p className="text-sm text-gray-500 font-poppins">
                To add articles, please follow the setup guide in SANITY_SETUP.md
              </p>
            </div>
          ) : (
            <>
              {/* Featured Article */}
              {articles[0] && (
                <div className="grid md:grid-cols-2 gap-8 mb-16">
                  {/* Featured Image */}
                  <div className="relative h-96 rounded-2xl overflow-hidden bg-gray-200">
                    {articles[0].imageUrl ? (
                      <Image
                        src={articles[0].imageUrl}
                        alt={articles[0].title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Featured Content */}
                  <div className="flex flex-col justify-center space-y-4">
                    <h2 className="text-4xl font-bold font-poppins" style={{ color: BRAND_COLORS.PRIMARY }}>
                      {articles[0].title}
                    </h2>
                    <p className="text-gray-600 font-poppins">
                      {articles[0].excerpt}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center gap-6 text-sm text-gray-500 font-poppins">
                      {articles[0].author && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          <span>{articles[0].author}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span>{new Date(articles[0].publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span>{articles[0].readTime}</span>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Link href={`/newsroom/${articles[0].slug.current}`}>
                        <Button
                          className="text-white px-8 py-3 rounded-full font-poppins font-medium transition-all duration-200 flex items-center gap-2"
                          style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = BRAND_COLORS.SECONDARY
                            e.currentTarget.style.color = BRAND_COLORS.PRIMARY
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = BRAND_COLORS.PRIMARY
                            e.currentTarget.style.color = 'white'
                          }}
                        >
                          Read more
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Article Grid */}
              <div className="grid md:grid-cols-3 gap-8">
                {articles.slice(1).map((article) => (
                  <div key={article._id} className="group">
                    {/* Article Image */}
                    <div className="relative h-64 rounded-2xl overflow-hidden bg-gray-200 mb-4">
                      {article.imageUrl ? (
                        <Image
                          src={article.imageUrl}
                          alt={article.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Article Content */}
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold font-poppins group-hover:underline" style={{ color: BRAND_COLORS.PRIMARY }}>
                        {article.title}
                      </h3>

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 font-poppins">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span>{article.readTime}</span>
                        </div>
                      </div>

                      <Link href={`/newsroom/${article.slug.current}`} className="inline-flex items-center gap-2 text-sm font-poppins font-medium group-hover:underline" style={{ color: BRAND_COLORS.PRIMARY }}>
                        Read more
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      <Footer />
    </div>
  )
}
