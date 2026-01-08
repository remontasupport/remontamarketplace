import NewsSlider from "./NewsSlider";

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

interface ArticlesResponse {
  success: boolean;
  articles: Article[];
  count: number;
  lastUpdated: string;
}

// Fallback articles in case API fails
const FALLBACK_ARTICLES: Article[] = [
  {
    _id: "fallback-1",
    author: "Remonta Team",
    excerpt: "Learn how to sign up for the NDIS step by step",
    featured: true,
    imageUrl: "/images/howToSignUp.webp",
    publishedAt: new Date().toISOString(),
    readTime: "5 min read",
    slug: { _type: "slug", current: "how-to-sign-up-ndis" },
    title: "How to Sign Up for the NDIS: Step-by-Step Guide"
  },
  {
    _id: "fallback-2",
    author: "Remonta Team",
    excerpt: "Discover how Remonta uses technology to empower families",
    featured: true,
    imageUrl: "/images/remontaAndTech.avif",
    publishedAt: new Date().toISOString(),
    readTime: "4 min read",
    slug: { _type: "slug", current: "remonta-and-technology" },
    title: "Remonta and Technology: Putting Choice Back in the Hands of Families"
  },
  {
    _id: "fallback-3",
    author: "Remonta Team",
    excerpt: "Understanding the Thriving Kids program and what it means for children with autism",
    featured: true,
    imageUrl: "/images/ndisForChildren.avif",
    publishedAt: new Date().toISOString(),
    readTime: "6 min read",
    slug: { _type: "slug", current: "ndis-changes-children-autism" },
    title: "NDIS Changes for Children with Autism: What Does \"Thriving Kids\" Mean?"
  }
];

// Fetch news articles from API with proper error handling
async function fetchNewsArticles(): Promise<Article[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch('https://www.remontaservices.com.au/api/articles/', {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Don't cache in this component, let Next.js handle it
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('[NEWS] API returned non-OK status:', response.status);
      return FALLBACK_ARTICLES;
    }

    const data: ArticlesResponse = await response.json();

    // Validate the response
    if (!data.articles || !Array.isArray(data.articles)) {
      console.warn('[NEWS] Invalid articles response');
      return FALLBACK_ARTICLES;
    }

    return data.articles.length > 0 ? data.articles : FALLBACK_ARTICLES;
  } catch (error) {
    // Return fallback articles to ensure the page always has content
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[NEWS] API request timed out - using fallback articles');
    } else {
      console.warn('[NEWS] Failed to fetch articles - using fallback:', error);
    }
    return FALLBACK_ARTICLES;
  }
}

/**
 * Async Server Component for News
 * This component fetches news from API but doesn't block page render
 * Use with Suspense boundary for streaming SSR
 */
export default async function NewsSliderAsync() {
  const articles = await fetchNewsArticles();
  return <NewsSlider articles={articles} />;
}
