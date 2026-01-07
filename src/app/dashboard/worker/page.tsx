/**
 * Worker Dashboard - Server Component
 * Protected route - only accessible to users with WORKER role
 * Uses getServerSession for server-side authentication (PRODUCTION-READY)
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth.config";
import { UserRole } from "@/types/auth";
import { authPrisma } from "@/lib/auth-prisma";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import NewsSlider from "@/components/dashboard/NewsSlider";
import ProfileCompletionReminder from "@/components/dashboard/ProfileCompletionReminder";
import {
  getAllCompletionStatusOptimized,
} from "@/services/worker/setupProgress.service";
import { getOrFetch, CACHE_KEYS, CACHE_TTL } from "@/lib/redis";

// Disable caching for this page - CRITICAL for security
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// News API caching - revalidate every 5 minutes to reduce load
const NEWS_REVALIDATE_TIME = 300; // 5 minutes in seconds

// TypeScript interfaces for API response
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

// Retry fetch with exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on the last attempt
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 100ms, 200ms, 400ms
        const delay = Math.min(1000, 100 * Math.pow(2, attempt));
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Failed to fetch after retries');
}

// Fetch news articles from API with proper error handling
async function fetchNewsArticles(): Promise<Article[]> {
  try {
    const response = await fetchWithRetry(
      'https://www.remontaservices.com.au/api/articles/',
      {
        next: { revalidate: NEWS_REVALIDATE_TIME }, // Cache for 5 minutes
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return FALLBACK_ARTICLES;
    }

    const data: ArticlesResponse = await response.json();

    // Validate the response
    if (!data.articles || !Array.isArray(data.articles)) {
      return FALLBACK_ARTICLES;
    }

    return data.articles.length > 0 ? data.articles : FALLBACK_ARTICLES;
  } catch (error) {
    // Return fallback articles to ensure the page always has content
    return FALLBACK_ARTICLES;
  }
}

export default async function WorkerDashboard() {
  // PERFORMANCE LOGGING: Track dashboard rendering
  const dashboardStart = Date.now();
  console.log('[DASHBOARD] Page render started');

  // Server-side session validation using getServerSession (RECOMMENDED APPROACH)
  const sessionStart = Date.now();
  const session = await getServerSession(authOptions);
  console.log('[DASHBOARD] getServerSession took:', Date.now() - sessionStart, 'ms');

  // Redirect to login if no session
  if (!session || !session.user) {
    redirect("/login");
  }

  // Redirect if wrong role
  if (session.user.role !== UserRole.WORKER) {
    redirect("/unauthorized");
  }

  // REDIS OPTIMIZATION: Cache worker profile to avoid slow database queries
  // First load: ~700ms (database), Subsequent loads: ~20-50ms (Redis cache)
  const profileStart = Date.now();
  const workerProfile = await getOrFetch(
    CACHE_KEYS.workerProfile(session.user.id),
    async () => {
      return await authPrisma.workerProfile.findUnique({
        where: { userId: session.user.id },
        select: {
          firstName: true,
          lastName: true,
          photos: true,
        },
      });
    },
    CACHE_TTL.WORKER_PROFILE
  );
  console.log('[DASHBOARD] Worker profile fetch took (with Redis):', Date.now() - profileStart, 'ms');

  // PHASE 1 OPTIMIZATION: Single optimized query replaces 4 separate functions
  // REDIS OPTIMIZATION: Cache completion status (biggest performance win!)
  // First load: ~7000ms (multiple DB queries), Subsequent loads: ~50ms (Redis cache)
  const dataStart = Date.now();
  const [newsArticles, completionResult] = await Promise.all([
    fetchNewsArticles(),
    getOrFetch(
      CACHE_KEYS.completionStatus(session.user.id),
      () => getAllCompletionStatusOptimized(session.user.id),
      CACHE_TTL.COMPLETION_STATUS
    ),
  ]);
  console.log('[DASHBOARD] Parallel data fetch took (with Redis):', Date.now() - dataStart, 'ms');

  // Construct setupProgress from optimized single-query result
  const setupProgress = completionResult.success && completionResult.data
    ? completionResult.data
    : {
        accountDetails: false,
        compliance: false,
        trainings: false,
        services: false,
      };

  console.log('[DASHBOARD] Total page render took:', Date.now() - dashboardStart, 'ms');

  // At this point, we have a valid WORKER session
  // This code only runs server-side, so it's completely secure
  return (
    <DashboardLayout
      profileData={{
        firstName: workerProfile?.firstName || 'Worker',
        // photos is now a string (single photo URL), not an array
        photo: workerProfile?.photos || null,
      }}
    >
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-content">
          <h2 className="hero-title">
            Welcome to Remonta!
          </h2>
          <p className="text-white/90 text-lg font-poppins mt-4 mb-8">
            Connecting support workers with families to create meaningful, life-changing relationships.
          </p>

          {/* Profile Completion Reminder */}
          <div style={{ maxWidth: '600px' }}>
            <ProfileCompletionReminder initialSetupProgress={setupProgress} />
          </div>
        </div>
        {/* Decorative elements */}
        <div className="hero-decoration hero-decoration-1"></div>
        <div className="hero-decoration hero-decoration-2"></div>
      </div>

      {/* News Section */}
      <div>
        <NewsSlider articles={newsArticles} />
      </div>
    </DashboardLayout>
  );
}
