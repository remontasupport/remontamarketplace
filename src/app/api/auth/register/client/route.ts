/**
 * Client Registration API Endpoint
 *
 * Creates User + ClientProfile + Participant + ServiceRequest.
 * - ClientProfile: User's contact info (firstName, lastName, mobile)
 * - Participant: Person needing support (personal info)
 * - ServiceRequest: Services needed, location, details
 *
 * POST /api/auth/register/client
 *
 * Request Body:
 * {
 *   firstName: string,
 *   lastName: string,
 *   mobile: string,
 *   fundingType: 'NDIS' | 'AGED_CARE' | 'INSURANCE' | 'PRIVATE' | 'OTHER',
 *   relationshipToClient: 'PARENT' | 'LEGAL_GUARDIAN' | 'SPOUSE_PARTNER' | 'CHILDREN' | 'OTHER',
 *   dateOfBirth?: string,
 *   clientFirstName?: string,
 *   clientLastName?: string,
 *   servicesRequested: { [categoryId]: { categoryName, subCategories: [{id, name}] } },
 *   additionalInfo?: string,
 *   location: string,
 *   email: string,
 *   password: string,
 *   consent: true,
 *   recaptchaToken?: string
 * }
 */

import { NextResponse } from 'next/server';
import { authPrisma } from '@/lib/auth-prisma';
import { hashPassword } from '@/lib/password';
import { applyRateLimit, strictApiRateLimit } from '@/lib/ratelimit';
import { verifyRecaptcha } from '@/lib/recaptcha';
import {
  clientRegistrationSchema,
  formatZodErrors,
  type ClientRegistrationInput,
} from '@/schema/registrationSchema';

export async function POST(request: Request) {
  try {
    // ============================================
    // RATE LIMITING
    // ============================================
    try {
      const rateLimitResult = await applyRateLimit(request, strictApiRateLimit);
      if (!rateLimitResult.success) {
        return rateLimitResult.response;
      }
    } catch {
      // Continue if rate limit check fails - fail open
    }

    try {
      // ============================================
      // PARSE REQUEST BODY
      // ============================================
      const body = await request.json();

      // ============================================
      // VALIDATE INPUT WITH ZOD
      // ============================================
      const validationResult = clientRegistrationSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: formatZodErrors(validationResult.error),
          },
          { status: 400 }
        );
      }

      const data: ClientRegistrationInput = validationResult.data;

      // ============================================
      // RECAPTCHA VERIFICATION (if provided)
      // ============================================
      if (data.recaptchaToken) {
        const recaptchaResult = await verifyRecaptcha(data.recaptchaToken, 'register');
        if (!recaptchaResult.success) {
          return NextResponse.json(
            { error: 'reCAPTCHA verification failed. Please try again.' },
            { status: 400 }
          );
        }
      }

      // ============================================
      // HASH PASSWORD (before DB operations to reduce lock time)
      // ============================================
      const passwordHash = await hashPassword(data.password);

      // ============================================
      // CREATE USER + CLIENT PROFILE
      // ============================================
      let user;
      try {
        user = await authPrisma.$transaction(async (tx) => {
          // Create User with ClientProfile
          const createdUser = await tx.user.create({
            data: {
              email: data.email,
              passwordHash,
              role: 'CLIENT',
              status: 'ACTIVE',
              updatedAt: new Date(),

              // ClientProfile: User's contact info
              clientProfile: {
                create: {
                  firstName: data.firstName,
                  lastName: data.lastName,
                  mobile: data.mobile,
                  updatedAt: new Date(),
                },
              },
            },
            include: {
              clientProfile: true,
            },
          });

          return createdUser;
        }, {
          maxWait: 10000, // wait up to 10s to acquire a connection
          timeout: 20000, // allow up to 20s for the transaction (handles Neon cold starts)
        });
      } catch (dbError: any) {
        // Handle unique constraint violation (duplicate email)
        if (dbError.code === 'P2002') {
          return NextResponse.json(
            { error: 'An account with this email already exists' },
            { status: 409 }
          );
        }
        throw dbError;
      }

      // ============================================
      // AUDIT LOG (fire-and-forget)
      // ============================================
      authPrisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_SUCCESS',
          metadata: {
            registrationType: 'CLIENT',
          },
        },
      }).catch(() => {
        // Don't fail registration if audit log fails
      });

      // ============================================
      // WEBHOOK
      // ============================================
      const webhookUrl = process.env.Client_Registration_Webhook
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            mobile: data.mobile,
            fundingType: data.fundingType ?? null,
            relationshipToClient: data.relationshipToClient ?? null,
          }),
        }).catch((err) => console.error('[Webhook] Client registration webhook failed:', err))
      }

      // ============================================
      // SUCCESS RESPONSE
      // ============================================
      return NextResponse.json(
        {
          success: true,
          message: 'Registration successful! You can now log in.',
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
          },
          registrationType: 'client',
        },
        { status: 201 }
      );

    } catch (error: any) {
      // Handle Prisma unique constraint errors (fallback)
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: 'Registration failed',
          message: error?.message || 'Unknown error occurred',
          ...(process.env.NODE_ENV === 'development' && {
            details: error?.message,
            stack: error?.stack,
          }),
        },
        { status: 500 }
      );
    }

  } catch (topLevelError: any) {
    return NextResponse.json(
      {
        error: 'Registration endpoint error',
        message: topLevelError?.message || 'Unknown error',
        ...(process.env.NODE_ENV === 'development' && {
          stack: topLevelError?.stack,
        }),
      },
      { status: 500 }
    );
  }
}
