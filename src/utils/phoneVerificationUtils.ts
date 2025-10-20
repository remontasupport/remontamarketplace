/**
 * Phone Verification Utilities
 *
 * This module contains phone verification logic and API integrations
 * that can be used for SMS verification workflows.
 * Currently stored here for future use.
 */

/**
 * Formats an Australian mobile number to E.164 format with spaces (Twilio format)
 * @param mobile - The mobile number to format
 * @returns Formatted mobile number in E.164 format with spaces
 */
export const formatAustralianMobileToE164 = (mobile: string): string => {
  // Remove all non-digit characters except +
  let cleanMobile = mobile.replace(/[^\d+]/g, '');

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

  return formattedMobile;
};

/**
 * Generates a random 6-digit verification code
 * @returns A 6-digit verification code as a string
 */
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Sends a verification code via SMS using Twilio
 * @param mobile - The mobile number to send the code to
 * @returns Promise with success status and optional dev code
 */
export const sendVerificationCodeSMS = async (mobile: string): Promise<{
  success: boolean;
  message: string;
  devCode?: string;
  error?: string;
}> => {
  try {
    const response = await fetch('/api/sms/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: data.message || 'Verification code sent successfully',
        devCode: data.devCode,
      };
    } else {
      return {
        success: false,
        message: data.error || 'Failed to send verification code',
        error: data.error,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to send verification code. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Verifies a code against the backend
 * @param mobile - The mobile number
 * @param code - The verification code to verify
 * @returns Promise with verification result
 */
export const verifyCodeWithBackend = async (mobile: string, code: string): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> => {
  try {
    const response = await fetch('/api/sms/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, code }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: data.message || 'Phone number verified successfully',
      };
    } else {
      return {
        success: false,
        message: data.error || 'Invalid verification code',
        error: data.error,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to verify code. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Hook state interface for phone verification
 */
export interface PhoneVerificationState {
  isCodeSent: boolean;
  verificationCode: string;
  sentCode: string;
  isVerified: boolean;
  isChangingNumber: boolean;
  tempMobile: string;
  isCodeIncorrect: boolean;
}

/**
 * Initial state for phone verification
 */
export const initialPhoneVerificationState: PhoneVerificationState = {
  isCodeSent: false,
  verificationCode: '',
  sentCode: '',
  isVerified: false,
  isChangingNumber: false,
  tempMobile: '',
  isCodeIncorrect: false,
};
