"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";
import ReCAPTCHA from "react-google-recaptcha";

interface ReCaptchaProps {
  onVerify: (token: string | null) => void;
  onExpired?: () => void;
  onError?: () => void;
  size?: "compact" | "normal" | "invisible";
  theme?: "light" | "dark";
}

export interface ReCaptchaRef {
  reset: () => void;
  execute: () => void;
}

const ReCaptcha = forwardRef<ReCaptchaRef, ReCaptchaProps>(
  ({ onVerify, onExpired, onError, size = "normal", theme = "light" }, ref) => {
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    // Get the site key from environment variables
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    useImperativeHandle(ref, () => ({
      reset: () => {
        recaptchaRef.current?.reset();
      },
      execute: () => {
        recaptchaRef.current?.execute();
      },
    }));

    if (!siteKey) {
      console.warn("reCAPTCHA site key not found in environment variables");
      return (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          ⚠️ reCAPTCHA configuration missing. Please contact support.
        </div>
      );
    }

    return (
      <div className="flex justify-center">
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={siteKey}
          onChange={onVerify}
          onExpired={onExpired}
          onError={onError}
          size={size}
          theme={theme}
        />
      </div>
    );
  }
);

ReCaptcha.displayName = "ReCaptcha";

export default ReCaptcha;
