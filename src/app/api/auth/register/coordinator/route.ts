/**
 * Coordinator Registration API Endpoint
 *
 * Creates User + CoordinatorProfile + Participant.
 * - CoordinatorProfile: Coordinator's contact info (firstName, lastName, mobile, organization, clientTypes)
 * - Participant: Participant details (personal info, services, location)
 *
 * POST /api/auth/register/coordinator
 *
 * Request Body:
 * {
 *   firstName: string,
 *   lastName: string,
 *   mobile: string,
 *   organization?: string,
 *   clientTypes: string[],
 *   clientFirstName: string,
 *   clientLastName: string,
 *   clientDateOfBirth: string,
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
  coordinatorRegistrationSchema,
  formatZodErrors,
  type CoordinatorRegistrationInput,
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
      const validationResult = coordinatorRegistrationSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: formatZodErrors(validationResult.error),
          },
          { status: 400 }
        );
      }

      const data: CoordinatorRegistrationInput = validationResult.data;

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
      // CREATE USER + COORDINATOR PROFILE + PARTICIPANT
      // ============================================
      let user;
      try {
        user = await authPrisma.user.create({
          data: {
            email: data.email, // Already normalized by Zod transform
            passwordHash,
            role: 'COORDINATOR',
            status: 'ACTIVE',
            updatedAt: new Date(),

            // CoordinatorProfile: Coordinator's contact info only
            coordinatorProfile: {
              create: {
                firstName: data.firstName,
                lastName: data.lastName,
                mobile: data.mobile,
                organization: data.organization || null,
                clientTypes: data.clientTypes,
                updatedAt: new Date(),
              },
            },

            // Participant: About the person needing support, services, location
            participants: {
              create: {
                firstName: data.clientFirstName,
                lastName: data.clientLastName,
                dateOfBirth: new Date(data.clientDateOfBirth),
                location: data.location,
                servicesRequested: data.servicesRequested,
                additionalInfo: data.additionalInfo || null,
                updatedAt: new Date(),
              },
            },
          },
          include: {
            coordinatorProfile: true,
            participants: true,
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
            registrationType: 'COORDINATOR',
            organization: data.organization || null,
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
