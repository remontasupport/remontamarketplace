/**
 * Share Token Utilities
 * Generate and verify JWT tokens for public profile sharing
 */

import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'your-secret-key-change-this'
);

interface ShareTokenPayload {
  userId: string;
  exp?: number;
}

/**
 * Generate a shareable token for a worker profile
 * @param userId - The worker's userId
 * @param expiryTime - Time until token expires (e.g., "30d", "2m", "1h") - default: 30 days
 * @returns JWT token string
 */
export async function generateShareToken(
  userId: string,
  expiryTime: string = '30d'
): Promise<string> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiryTime)
    .sign(SECRET_KEY);

  return token;
}

/**
 * Verify and decode a share token
 * @param token - The JWT token to verify
 * @returns userId if valid, null if invalid/expired
 */
export async function verifyShareToken(
  token: string
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload.userId as string;
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}
