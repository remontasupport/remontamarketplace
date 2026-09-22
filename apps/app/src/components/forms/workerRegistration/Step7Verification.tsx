import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Step7VerificationProps {
  watchedMobile: string;
  isCodeSent: boolean;
  isVerified: boolean;
  isChangingNumber: boolean;
  verificationCode: string;
  tempMobile: string;
  setVerificationCode: (code: string) => void;
  setTempMobile: (mobile: string) => void;
  sendVerificationCode: () => void;
  verifyCode: () => void;
  handleChangeNumber: () => void;
  handleSaveNewNumber: () => void;
  handleCancelChangeNumber: () => void;
  setIsCodeSent: (value: boolean) => void;
  setIsVerified: (value: boolean) => void;
}

export function Step7Verification({
  watchedMobile,
  isCodeSent,
  isVerified,
  isChangingNumber,
  verificationCode,
  tempMobile,
  setVerificationCode,
  setTempMobile,
  sendVerificationCode,
  verifyCode,
  handleChangeNumber,
  handleSaveNewNumber,
  handleCancelChangeNumber,
  setIsCodeSent,
  setIsVerified
}: Step7VerificationProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-poppins font-semibold">Phone Verification</h3>

      {isChangingNumber ? (
        <div className="space-y-4">
          <div>
            <Label className="text-lg font-poppins font-medium">
              New Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              type="tel"
              value={tempMobile}
              onChange={(e) => setTempMobile(e.target.value)}
              placeholder="04XX XXX XXX"
              className="text-lg font-poppins mt-2"
            />
            <p className="text-sm text-gray-600 font-poppins mt-1">
              Enter a valid Australian mobile number
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={handleSaveNewNumber}
              className="bg-[#0C1628] hover:bg-[#A3DEDE] text-white px-6 py-2 text-lg font-poppins"
            >
              Save
            </Button>
            <Button
              type="button"
              onClick={handleCancelChangeNumber}
              variant="outline"
              className="px-6 py-2 text-lg font-poppins"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm font-poppins text-blue-800">
              We'll send a verification code to: <strong>{watchedMobile}</strong>
            </p>
          </div>

          {!isCodeSent ? (
            <div className="text-center">
              <Button
                type="button"
                onClick={sendVerificationCode}
                className="bg-[#0C1628] hover:bg-[#A3DEDE] text-white px-8 py-3 text-lg font-poppins"
              >
                Send Verification Code
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-lg font-poppins font-medium">
                  Enter 6-Digit Verification Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="text-2xl font-poppins text-center tracking-widest mt-2"
                />
                <p className="text-sm text-gray-600 font-poppins mt-2">
                  Please enter the 6-digit code sent to your mobile number.
                </p>
              </div>

              {!isVerified && (
                <div className="text-center">
                  <Button
                    type="button"
                    onClick={verifyCode}
                    disabled={verificationCode.length !== 6}
                    className="bg-[#0C1628] hover:bg-[#A3DEDE] text-white px-8 py-3 text-lg font-poppins disabled:opacity-50"
                  >
                    Verify Code
                  </Button>
                </div>
              )}

              {isVerified && (
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-green-700 font-poppins font-medium">
                    ✓ Phone number verified successfully!
                  </p>
                </div>
              )}

              <div className="text-center space-y-2">
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCodeSent(false);
                      setVerificationCode("");
                      setIsVerified(false);
                    }}
                    className="text-sm text-blue-600 hover:underline font-poppins"
                  >
                    Resend Code
                  </button>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleChangeNumber}
                    className="text-sm text-blue-600 hover:underline font-poppins"
                  >
                    Change Number
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
