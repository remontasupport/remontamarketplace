import { useState } from "react";

export const usePhoneVerification = () => {
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isChangingNumber, setIsChangingNumber] = useState(false);
  const [tempMobile, setTempMobile] = useState("");

  const sendVerificationCode = async (mobile: string) => {
    try {
      const response = await fetch('/api/sms/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsCodeSent(true);
        if (data.devCode) {
          setSentCode(data.devCode);
          console.log('🔐 Verification code received');
        }
      } else {
        console.error('SMS Error Details:', data);
        alert(data.error || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      alert('Failed to send verification code. Please try again.');
    }
  };

  const verifyCode = () => {
    if (verificationCode.length !== 6) {
      alert('Please enter a valid 6-digit code');
      return;
    }

    if (verificationCode === sentCode) {
      setIsVerified(true);
      console.log('✅ Phone number verified successfully');
    } else {
      alert('Invalid verification code');
    }
  };

  const resetVerification = () => {
    setIsCodeSent(false);
    setVerificationCode("");
    setSentCode("");
    setIsVerified(false);
  };

  const startChangingNumber = (currentMobile: string) => {
    setIsChangingNumber(true);
    setTempMobile(currentMobile);
  };

  const cancelChangingNumber = () => {
    setIsChangingNumber(false);
    setTempMobile("");
    resetVerification();
  };

  return {
    isCodeSent,
    verificationCode,
    setVerificationCode,
    isVerified,
    isChangingNumber,
    tempMobile,
    setTempMobile,
    sendVerificationCode,
    verifyCode,
    resetVerification,
    startChangingNumber,
    cancelChangingNumber,
  };
};
