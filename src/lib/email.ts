/**
 * Email Service using Resend
 *
 * Production-ready email sending for:
 * - Email verification
 * - Password reset
 * - Account notifications
 */

import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const APP_NAME = 'Remonta';
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

/**
 * Send email verification code
 *
 * @param email - Recipient email address
 * @param verificationCode - 6-digit verification code
 * @param firstName - User's first name for personalization
 */
export async function sendVerificationEmail(
  email: string,
  verificationCode: string,
  firstName: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Your ${APP_NAME} verification code`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #0C1628; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background-color: #0C1628; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
              .warning { background-color: #fff3cd; border-left: 4px solid: #ffc107; padding: 12px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to ${APP_NAME}!</h1>
              </div>
              <div class="content">
                <p>Hi ${firstName},</p>

                <p>Thank you for registering as a support worker with ${APP_NAME}. We're excited to have you join our community!</p>

                <p>To complete your registration and activate your account, please enter the verification code below:</p>

                <div style="text-align: center; margin: 30px 0;">
                  <div style="background-color: #f0f4ff; border: 2px solid #0C1628; border-radius: 8px; padding: 20px; display: inline-block;">
                    <p style="margin: 0; font-size: 14px; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                    <p style="margin: 10px 0 0 0; font-size: 36px; font-weight: bold; color: #0C1628; letter-spacing: 8px; font-family: 'Courier New', monospace;">${verificationCode}</p>
                  </div>
                </div>

                <div class="warning">
                  <strong>⚠️ This code will expire in 15 minutes.</strong>
                </div>

                <p><strong>Next Steps:</strong></p>
                <ol>
                  <li>Enter the verification code on the registration page</li>
                  <li>Complete your profile verification (upload required documents)</li>
                  <li>Start connecting with clients!</li>
                </ol>

                <p>If you didn't create this account, you can safely ignore this email.</p>

                <p>Best regards,<br>The ${APP_NAME} Team</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
                <p>This code is valid for 15 minutes only.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
    
      throw new Error(`Failed to send verification email: ${error.message || 'Unknown error'}`);
    }

   
    return data;
  } catch (error) {
  
    throw error;
  }
}

/**
 * Send password reset email
 *
 * @param email - Recipient email address
 * @param resetToken - Unique reset token
 * @param firstName - User's first name
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  firstName: string
) {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Reset your ${APP_NAME} password`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #0C1628; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background-color: #dc3545; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
              .warning { background-color: #f8d7da; border-left: 4px solid: #dc3545; padding: 12px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Password Reset Request</h1>
              </div>
              <div class="content">
                <p>Hi ${firstName},</p>

                <p>We received a request to reset your password for your ${APP_NAME} account.</p>

                <p>Click the button below to create a new password:</p>

                <div style="text-align: center;">
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </div>

                <div class="warning">
                  <strong>⚠️ This link will expire in 1 hour.</strong><br>
                  If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
                </div>

                <p><strong>Security Tip:</strong> Choose a strong password that includes uppercase and lowercase letters, numbers, and special characters.</p>

                <p>Best regards,<br>The ${APP_NAME} Team</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
    
      throw new Error('Failed to send password reset email');
    }

  
    return data;
  } catch (error) {
  
    throw error;
  }
}

/**
 * Send welcome email after email verification
 *
 * @param email - Recipient email address
 * @param firstName - User's first name
 */
export async function sendWelcomeEmail(email: string, firstName: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Welcome to ${APP_NAME}! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #0C1628; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background-color: #28a745; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Email Verified!</h1>
              </div>
              <div class="content">
                <p>Hi ${firstName},</p>

                <p>Great news! Your email has been successfully verified.</p>

                <p><strong>What's Next?</strong></p>
                <ol>
                  <li>Complete your worker verification (upload required documents)</li>
                  <li>Build your profile to attract clients</li>
                  <li>Start receiving connection requests</li>
                </ol>

                <div style="text-align: center;">
                  <a href="${APP_URL}/dashboard/worker" class="button">Go to Dashboard</a>
                </div>

                <p>We're excited to have you as part of the ${APP_NAME} community!</p>

                <p>Best regards,<br>The ${APP_NAME} Team</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
    
      // Don't throw - welcome email is not critical
      return null;
    }

  
    return data;
  } catch (error) {
   
    // Don't throw - welcome email is not critical
    return null;
  }
}
