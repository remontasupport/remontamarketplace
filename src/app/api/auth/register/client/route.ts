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
  // Rate limiting — fail open (don't block if Redis is down)
  try {
    const rl = await applyRateLimit(request, strictApiRateLimit);
    if (!rl.success) return rl.response;
  } catch {}

  try {
    const body = await request.json();

    const parsed = clientRegistrationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatZodErrors(parsed.error) },
        { status: 400 }
      );
    }

    const data: ClientRegistrationInput = parsed.data;

    // reCAPTCHA (optional)
    if (data.recaptchaToken) {
      const recaptcha = await verifyRecaptcha(data.recaptchaToken, 'register');
      if (!recaptcha.success) {
        return NextResponse.json(
          { error: 'reCAPTCHA verification failed. Please try again.' },
          { status: 400 }
        );
      }
    }

    // Hash password before DB ops to minimise transaction lock time
    const passwordHash = await hashPassword(data.password);

    // Create User + ClientProfile — nested create is atomic in Prisma
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
              isSelfManaged: data.completingFormAs === 'self',
              updatedAt: new Date(),
            },
          },
        },
        select: { id: true, email: true, role: true, status: true },
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
      throw err;
    }

    // Audit log — fire and forget
    authPrisma.auditLog.create({
      data: { userId: user.id, action: 'LOGIN_SUCCESS', metadata: { registrationType: 'CLIENT' } },
    }).catch(() => {});

    // Webhook — fire and forget (do NOT await — external latency must not block the response)
    const webhookUrl = process.env.Client_Registration_Webhook;
    if (webhookUrl) {
      fetch(webhookUrl, {
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
          completingFormAs: data.completingFormAs,
        }),
      }).catch((err) => console.error('[Webhook] Client registration failed:', err));
    }

    return NextResponse.json(
      { success: true, message: 'Registration successful! You can now log in.', user, registrationType: 'client' },
      { status: 201 }
    );

  } catch (error: any) {
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
        ...(process.env.NODE_ENV === 'development' && { stack: error?.stack }),
      },
      { status: 500 }
    );
  }
}
