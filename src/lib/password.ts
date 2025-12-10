/**
 * Password Hashing Utilities
 *
 * Production-ready password security using bcrypt
 * Following best practices from production_ready_authentication.md
 */

import bcrypt from 'bcryptjs';

/**
 * Salt rounds for bcrypt
 * 12 rounds provides strong security while maintaining reasonable performance
 * Higher = more secure but slower
 */
const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 *
 * @param password - Plain text password
 * @returns Promise<string> - Hashed password
 *
 * @example
 * const hash = await hashPassword('MySecurePass123!');
 * // Returns: $2a$12$randomsalt...hashedpassword
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
 
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify a password against a hash
 *
 * @param password - Plain text password to verify
 * @param hash - Stored password hash
 * @returns Promise<boolean> - True if password matches
 *
 * @example
 * const isValid = await verifyPassword('MySecurePass123!', storedHash);
 * // Returns: true or false
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    const isValid = await bcrypt.compare(password, hash);
    return isValid;
  } catch (error) {
  
    return false;
  }
}

/**
 * Generate a secure random token
 * Used for email verification, password reset, etc.
 *
 * @param length - Length of token in bytes (default: 32)
 * @returns string - Hex encoded token
 *
 * @example
 * const token = generateSecureToken();
 * // Returns: a1b2c3d4e5f6...
 */
export function generateSecureToken(length: number = 32): string {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a verification token with expiry
 *
 * @param expiryHours - Hours until token expires (default: 24)
 * @returns Object with token and expiry date
 */
export function generateVerificationToken(expiryHours: number = 24) {
  const token = generateSecureToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + expiryHours);

  return {
    token,
    expires,
  };
}

/**
 * Generate a 6-digit verification code
 * Used for email verification
 *
 * @param expiryMinutes - Minutes until code expires (default: 15)
 * @returns Object with code and expiry date
 *
 * @example
 * const { code, expires } = generateVerificationCode(15);
 * // Returns: { code: "123456", expires: Date }
 */
export function generateVerificationCode(expiryMinutes: number = 15) {
  // Generate 6-digit code (100000 to 999999)
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + expiryMinutes);

  return {
    code,
    expires,
  };
}

/**
 * Generate a secure verification session token
 * Used to identify pending verification without exposing email in URL
 *
 * @param expiryMinutes - Minutes until session expires (default: 15)
 * @returns Object with session token and expiry
 *
 * @example
 * const { token, expires } = generateVerificationSession(15);
 * // Returns: { token: "vfy_a1b2c3d4...", expires: Date }
 */
export function generateVerificationSession(expiryMinutes: number = 15) {
  const crypto = require('crypto');
  // Generate URL-safe token
  const randomToken = crypto.randomBytes(32).toString('hex');
  const token = `vfy_${randomToken}`;

  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + expiryMinutes);

  return {
    token,
    expires,
  };
}
