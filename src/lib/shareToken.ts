/**
 * Share Token Utilities
 * Generate and verify encrypted tokens for public profile sharing
 * Uses AES-256-GCM encryption to create short, secure tokens
 */

import crypto from 'crypto';

// Encryption settings
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes for GCM mode
const AUTH_TAG_LENGTH = 16; // 16 bytes for GCM auth tag

// Derive a 32-byte key from NEXTAUTH_SECRET
const SECRET_KEY = crypto
  .createHash('sha256')
  .update(process.env.NEXTAUTH_SECRET || 'your-secret-key-change-this')
  .digest();

/**
 * Parse expiry time string to milliseconds
 * @param expiryTime - Time string (e.g., "30d", "2m", "1h", "100ms")
 * @returns Milliseconds
 */
function parseExpiryTime(expiryTime: string): number {
  // Handle milliseconds separately (e.g., "100ms")
  if (expiryTime.endsWith('ms')) {
    const value = parseInt(expiryTime.slice(0, -2), 10);
    return isNaN(value) ? 30 * 24 * 60 * 60 * 1000 : value;
  }

  const unit = expiryTime.slice(-1);
  const value = parseInt(expiryTime.slice(0, -1), 10);

  if (isNaN(value)) {
    return 30 * 24 * 60 * 60 * 1000; // Default: 30 days
  }

  switch (unit) {
    case 'd': // days
      return value * 24 * 60 * 60 * 1000;
    case 'h': // hours
      return value * 60 * 60 * 1000;
    case 'm': // months
      return value * 30 * 24 * 60 * 60 * 1000;
    case 's': // seconds
      return value * 1000;
    default:
      return 30 * 24 * 60 * 60 * 1000; // Default: 30 days
  }
}

/**
 * Generate a shareable token for a worker profile
 * Creates a short, encrypted token containing userId and expiration
 * @param userId - The worker's userId
 * @param expiryTime - Time until token expires (e.g., "30d", "2m", "1h") - default: 30 days
 * @returns Encrypted token string (~70% shorter than JWT)
 */
export async function generateShareToken(
  userId: string,
  expiryTime: string = '30d'
): Promise<string> {
  // Calculate expiration timestamp
  const expirationMs = parseExpiryTime(expiryTime);
  const expiresAt = Date.now() + expirationMs;

  // Create compact payload: userId|expiresAt
  const payload = `${userId}|${expiresAt}`;

  // Generate random IV (Initialization Vector)
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);

  // Encrypt payload
  const encrypted = Buffer.concat([
    cipher.update(payload, 'utf8'),
    cipher.final()
  ]);

  // Get authentication tag
  const authTag = cipher.getAuthTag();

  // Combine: iv + authTag + encrypted data
  const combined = Buffer.concat([iv, authTag, encrypted]);

  // Convert to URL-safe base64 string
  const token = combined.toString('base64url');

  return token;
}

/**
 * Verify and decode a share token
 * @param token - The encrypted token to verify
 * @returns userId if valid and not expired, null if invalid/expired
 */
export async function verifyShareToken(
  token: string
): Promise<string | null> {
  try {
    // Decode from base64url
    const combined = Buffer.from(token, 'base64url');

    // Check minimum length (IV + authTag + at least 1 byte encrypted)
    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
      return null;
    }

    // Extract components
    const iv = combined.slice(0, IV_LENGTH);
    const authTag = combined.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.slice(IV_LENGTH + AUTH_TAG_LENGTH);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]).toString('utf8');

    // Parse payload: userId|expiresAt
    const parts = decrypted.split('|');
    if (parts.length !== 2) {
      return null;
    }

    const [userId, expiresAtStr] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    // Validate expiration timestamp
    if (isNaN(expiresAt)) {
      return null;
    }

    // Check if token has expired
    if (Date.now() > expiresAt) {
      return null; // Token expired
    }

    return userId;
  } catch (error) {
    // Token is invalid, corrupted, or decryption failed
    return null;
  }
}
