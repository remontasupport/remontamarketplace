import { useState } from 'react';
import { isValidAustralianMobile } from '@/utils/registrationUtils';

interface UsePhoneVerificationReturn {
  // State
  isCodeSent: boolean;
  verificationCode: string;
  sentCode: string;
  isVerified: boolean;
  isChangingNumber: boolean;
  tempMobile: string;
  isCodeIncorrect: boolean;

  // Setters
  setVerificationCode: (code: string) => void;
  setTempMobile: (mobile: string) => void;
  setIsCodeSent: (sent: boolean) => void;
  setIsVerified: (verified: boolean) => void;
  setIsCodeIncorrect: (incorrect: boolean) => void;

  // Actions
  sendVerificationCode: (mobile: string) => Promise<void>;
  verifyCode: () => void;
  handleChangeNumber: (setValue?: (field: string, value: string) => void) => void;
  handleSaveNewNumber: (setValue: (field: string, value: string) => void, trigger: (field: string) => Promise<boolean>) => Promise<void>;
  handleCancelChangeNumber: () => void;
  resetVerification: () => void;
}

export function usePhoneVerification(): UsePhoneVerificationReturn {
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isChangingNumber, setIsChangingNumber] = useState(false);
  const [tempMobile, setTempMobile] = useState("");
  const [isCodeIncorrect, setIsCodeIncorrect] = useState(false);

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
        }
      } else {
       
        alert(data.error || 'Failed to send verification code');
      }
    } catch (error) {
    
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
      setIsCodeIncorrect(false);
     
    } else {
      setIsCodeIncorrect(true);
      
    }
  };

  const handleChangeNumber = (setValue?: (field: string, value: string) => void) => {
    // Reset all verification states to allow editing
    setIsVerified(false);
    setIsCodeSent(false);
    setVerificationCode("");
    setSentCode("");
    setIsCodeIncorrect(false);

    // Clear the phone number field if setValue is provided
    if (setValue) {
      setValue("mobile", "");
    }
  };

  const handleSaveNewNumber = async (
    setValue: (field: string, value: string) => void,
    trigger: (field: string) => Promise<boolean>
  ) => {
    if (isValidAustralianMobile(tempMobile)) {
      setValue("mobile", tempMobile);
      await trigger("mobile");

      setIsChangingNumber(false);
      setIsCodeSent(false);
      setVerificationCode("");
      setSentCode("");
      setIsVerified(false);
    } else {
      alert("Please enter a valid Australian mobile number");
    }
  };

  const handleCancelChangeNumber = () => {
    setIsChangingNumber(false);
    setTempMobile("");
    setIsCodeSent(false);
    setVerificationCode("");
    setSentCode("");
  };

  const resetVerification = () => {
    setIsCodeSent(false);
    setVerificationCode("");
    setSentCode("");
    setIsVerified(false);
    setIsChangingNumber(false);
    setTempMobile("");
  };

  return {
    // State
    isCodeSent,
    verificationCode,
    sentCode,
    isVerified,
    isChangingNumber,
    tempMobile,
    isCodeIncorrect,

    // Setters
    setVerificationCode,
    setTempMobile,
    setIsCodeSent,
    setIsVerified,
    setIsCodeIncorrect,

    // Actions
    sendVerificationCode,
    verifyCode,
    handleChangeNumber,
    handleSaveNewNumber,
    handleCancelChangeNumber,
    resetVerification,
  };
}
