/**
 * Client Registration API Endpoint
 *
 * Handles both "self" and "client" registration paths:
 * - Self: Person registering for themselves (isSelfManaged: true)
 * - Client: Person registering on behalf of someone else (isSelfManaged: false)
 *
 * Creates User + ClientProfile only. Participant details are collected separately.
 *
 * POST /api/auth/register/client
 *
 * Request Body:
 * {
 *   firstName: string,
 *   lastName: string,
 *   mobile: string,
 *   isSelfManaged: boolean,
 *   fundingType: 'NDIS' | 'AGED_CARE' | 'INSURANCE' | 'PRIVATE' | 'OTHER',
 *   relationshipToClient: 'PARENT' | 'LEGAL_GUARDIAN' | 'SPOUSE_PARTNER' | 'CHILDREN' | 'OTHER',
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
        user = await authPrisma.user.create({
          data: {
            email: data.email,
            passwordHash,
            role: 'CLIENT',
            status: 'ACTIVE',
            updatedAt: new Date(),

            clientProfile: {
              create: {
                firstName: data.firstName,
                lastName: data.lastName,
                mobile: data.mobile,
                location: data.location,
                fundingType: data.fundingType,
                relationshipToClient: data.isSelfManaged ? 'OTHER' : data.relationshipToClient,
                servicesRequested: data.servicesRequested,
                additionalInfo: data.additionalInfo || null,
                isSelfManaged: data.isSelfManaged,
                updatedAt: new Date(),
              },
            },
          },
          include: {
            clientProfile: true,
          },
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
            registrationType: data.isSelfManaged ? 'CLIENT_SELF' : 'CLIENT_REPRESENTATIVE',
            fundingType: data.fundingType,
          },
        },
      }).catch(() => {
        // Don't fail registration if audit log fails
      });

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
          registrationType: data.isSelfManaged ? 'self' : 'client',
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
