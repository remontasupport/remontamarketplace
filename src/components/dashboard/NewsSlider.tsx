"use client";

import { useState, useEffect } from "react";
import Loader from "@/components/ui/Loader";

interface Article {
  _id: string;
  author: string;
  excerpt: string;
  featured: boolean;
  imageUrl: string;
  publishedAt: string;
  readTime: string;
  slug: {
    _type: string;
    current: string;
  };
  title: string;
}

interface NewsSliderProps {
  articles: Article[];
  isLoading?: boolean;
}

export default function NewsSlider({ articles, isLoading = false }: NewsSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive items per page - show all on mobile for swipe, 6 on desktop for pagination
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      const newItemsPerPage = mobile ? articles.length : 6;

      setIsMobile(mobile);

      if (newItemsPerPage !== itemsPerPage) {
        setItemsPerPage(newItemsPerPage);
        // Reset to first page when switching between mobile/desktop
        setCurrentIndex(0);
      }
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [itemsPerPage, articles.length]);

  // Show loading state (same as training steps)
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Loader size="lg" />
      </div>
    );
  }

  // Calculate total pages
  const totalPages = Math.ceil(articles.length / itemsPerPage);

  // Get current articles to display
  const currentArticles = articles.slice(
    currentIndex,
    currentIndex + itemsPerPage
  );

  // Handle previous button
  const handlePrevious = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev - itemsPerPage;
      return newIndex < 0 ? Math.max(0, articles.length - itemsPerPage) : newIndex;
    });
  };

  // Handle next button
  const handleNext = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev + itemsPerPage;
      return newIndex >= articles.length ? 0 : newIndex;
    });
  };

  // Show message if no articles
  if (articles.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No news articles available at the moment.</p>
      </div>
    );
  }

  // Check if we need navigation (more than 6 articles on desktop only, hide on mobile for swipe)
  const showNavigation = articles.length > 6 && !isMobile;

  return (
    <div className="news-slider-wrapper">
      {showNavigation && (
        <div className="section-header-main">
          <h3 className="section-title-main">Read more news</h3>
          <div className="section-nav-btns">
            <button
              className="nav-arrow-btn"
              onClick={handlePrevious}
              aria-label="Previous news"
            >
              ←
            </button>
            <button
              className="nav-arrow-btn"
              onClick={handleNext}
              aria-label="Next news"
            >
              →
            </button>
          </div>
        </div>
      )}

      <div className={isMobile ? "course-cards-grid news-swipeable" : "course-cards-grid"}>
        {currentArticles.map((article) => (
          <a
            key={article._id}
            href={`https://www.remontaservices.com.au/newsroom/${article.slug.current}`}
            target="_blank"
            rel="noopener noreferrer"
            className="course-card"
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
          >
            <div className="course-thumbnail">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="course-thumbnail-image"
                loading="lazy"
              />
            </div>
            <div className="course-card-content">
              <h4 className="course-card-title">{article.title}</h4>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
