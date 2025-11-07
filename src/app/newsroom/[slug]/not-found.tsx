import Link from 'next/link'
import Footer from "@/components/ui/layout/Footer"
import '../../styles/article.css'

export default function NotFound() {
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
