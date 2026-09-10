/**
 * Articles API Route
 * Redirects to external Remonta newsroom articles
 */

import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Redirect to external newsroom article
  const redirectUrl = `https://www.remontaservices.com.au/newsroom/${slug}`;

  return NextResponse.redirect(redirectUrl, 301);
}
