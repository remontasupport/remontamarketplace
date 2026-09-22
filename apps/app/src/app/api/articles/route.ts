/**
 * Articles List API Route
 * Redirects to external Remonta newsroom
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // Redirect to external newsroom
  return NextResponse.redirect('https://www.remontaservices.com.au/newsroom', 301);
}
