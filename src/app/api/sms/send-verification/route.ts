import { NextRequest, NextResponse } from 'next/server';

// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const { mobile } = await request.json();

    if (!mobile) {
      return NextResponse.json(
        { error: 'Mobile number is required' },
        { status: 400 }
      );
    }

    // Convert Australian number to E.164 format with spaces (Twilio trial format)
    // Remove all non-digit characters except +
    let cleanMobile = mobile.replace(/[^\d+]/g, '');

    // Convert to E.164 format WITH SPACES (to match Twilio verified number format)
    let formattedMobile = cleanMobile;

    // If starts with 0, replace with +61
    if (cleanMobile.startsWith('0')) {
      const numberPart = cleanMobile.substring(1);
      // Format as +61 4XX XXX XXX (with spaces for Twilio trial)
      formattedMobile = `+61 ${numberPart.substring(0, 3)} ${numberPart.substring(3, 6)} ${numberPart.substring(6)}`;
    }
    // If starts with 61 (without +), add +
    else if (cleanMobile.startsWith('61') && !cleanMobile.startsWith('+')) {
      const numberPart = cleanMobile.substring(2);
      formattedMobile = `+61 ${numberPart.substring(0, 3)} ${numberPart.substring(3, 6)} ${numberPart.substring(6)}`;
    }
    // If doesn't start with + and not 0, assume missing +61
    else if (!cleanMobile.startsWith('+') && !cleanMobile.startsWith('0')) {
      formattedMobile = `+61 ${cleanMobile.substring(0, 3)} ${cleanMobile.substring(3, 6)} ${cleanMobile.substring(6)}`;
    }
    // If already has +61, just format with spaces
    else if (cleanMobile.startsWith('+61')) {
      const numberPart = cleanMobile.substring(3);
      formattedMobile = `+61 ${numberPart.substring(0, 3)} ${numberPart.substring(3, 6)} ${numberPart.substring(6)}`;
    }

    console.log(`Converting "${mobile}" to "${formattedMobile}"`);

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Always log the code for testing/debugging
    console.log('\n' + '='.repeat(50));
    console.log(`🔐 VERIFICATION CODE: ${code}`);
    console.log(`📱 Phone Number: ${mobile} → ${formattedMobile}`);
    console.log(`⏰ Expires in: 10 minutes`);
    console.log('='.repeat(50) + '\n');

    // Store code with 10-minute expiration (use original mobile as key for consistency)
    const expiresAt = Date.now() + 10 * 60 * 1000;
    const storageKey = mobile.replace(/\s/g, ''); // Remove spaces for consistent key
    verificationCodes.set(storageKey, { code, expiresAt });

    // Check if we should use DEV MODE or send actual SMS
    const isDev = process.env.SMS_DEV_MODE === 'true' || process.env.NODE_ENV === 'development';

    if (isDev) {
      // DEV MODE: Don't send SMS, return code directly
      console.log(`[DEV MODE] Verification code for ${mobile}: ${code}`);
      return NextResponse.json({
        success: true,
        message: 'Verification code sent (dev mode)',
        devCode: code
      });
    }

    // PRODUCTION MODE: Send SMS using Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.error('Twilio credentials not configured');
      return NextResponse.json(
        { error: 'SMS service not configured' },
        { status: 500 }
      );
    }

    // Twilio API call
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    console.log(`Sending SMS to ${formattedMobile} from ${fromNumber}`);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: formattedMobile,
        From: fromNumber,
        Body: `Your Remonta verification code is: ${code}. Valid for 10 minutes.`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Twilio error:', error);

      // If it's a trial account error, provide helpful message
      if (error.code === 21608 || error.message?.includes('trial')) {
        return NextResponse.json(
          {
            error: 'This number needs to be verified in Twilio console (trial account)',
            details: error,
            devCode: code // Still return code for testing
          },
          { status: 400 }
        );
      }

      // Return detailed error message
      const errorMessage = error.message || error.error?.message || 'Failed to send SMS';
      return NextResponse.json(
        {
          error: errorMessage,
          details: error
        },
        { status: 500 }
      );
    }

    console.log(`✅ SMS sent successfully to ${formattedMobile}`);

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully'
    });

  } catch (error) {
    console.error('Error sending verification code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
