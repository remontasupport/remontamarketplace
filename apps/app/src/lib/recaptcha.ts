/**
 * Google reCAPTCHA v3 Utilities
 *
 * Provides server-side verification for reCAPTCHA tokens
 *
 * Setup Instructions:
 * 1. Get reCAPTCHA keys from: https://www.google.com/recaptcha/admin
 * 2. Choose reCAPTCHA v3
 * 3. Add site key to NEXT_PUBLIC_RECAPTCHA_SITE_KEY
 * 4. Add secret key to RECAPTCHA_SECRET_KEY
 */

interface RecaptchaResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  'error-codes'?: string[];
}

/**
 * Verify a reCAPTCHA token on the server
 *
 * @param token - The reCAPTCHA token from the client
 * @param expectedAction - The action name (e.g., 'register', 'login')
 * @returns Promise<{ success: boolean; score: number; error?: string }>
 *
 * @example
 * const result = await verifyRecaptcha(token, 'register');
 * if (!result.success) {
 *   return NextResponse.json({ error: 'reCAPTCHA verification failed' }, { status: 400 });
 * }
 */
export async function verifyRecaptcha(
  token: string,
  expectedAction: string = 'submit'
): Promise<{ success: boolean; score: number; error?: string }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // Skip verification in development if not configured
  if (!secretKey) {
  
    return { success: true, score: 1.0 };
  }

  if (!token) {
    return { success: false, score: 0, error: 'reCAPTCHA token is missing' };
  }

  try {
    const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data: RecaptchaResponse = await response.json();

    if (!data.success) {
     
      return {
        success: false,
        score: 0,
        error: 'reCAPTCHA verification failed',
      };
    }

    // Check if action matches (prevents token reuse for different actions)
    if (data.action !== expectedAction) {
   
      return {
        success: false,
        score: data.score,
        error: 'reCAPTCHA action mismatch',
      };
    }

    // reCAPTCHA v3 returns a score (0.0 - 1.0)
    // 0.0 = very likely a bot
    // 1.0 = very likely a human
    // Recommended threshold: 0.5
    const threshold = 0.5;

    if (data.score < threshold) {
   
      return {
        success: false,
        score: data.score,
        error: 'reCAPTCHA score too low - possible bot activity',
      };
    }



    return { success: true, score: data.score };

  } catch (error) {
   

    // In production, you might want to fail closed (reject the request)
    // In development, fail open (allow the request)
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      success: !isProduction,
      score: 0,
      error: 'reCAPTCHA verification error',
    };
  }
}

/**
 * Check if reCAPTCHA is configured
 */
export function isRecaptchaConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY &&
    process.env.RECAPTCHA_SECRET_KEY
  );
}
