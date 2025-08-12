"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { BookOpen, ArrowLeft, Mail } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import ReCaptcha, { ReCaptchaRef } from "@/components/ReCaptcha";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const router = useRouter();
  const recaptchaRef = useRef<ReCaptchaRef>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recaptchaToken) {
      toast.error("Please verify that you're not a robot");
      return;
    }

    setLoading(true);

    try {
      // Verify reCAPTCHA on backend first
      const captchaResponse = await fetch("/api/auth/verify-captcha", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: recaptchaToken }),
      });

      if (!captchaResponse.ok) {
        throw new Error("reCAPTCHA verification failed");
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        // Reset reCAPTCHA on error
        recaptchaRef.current?.reset();
        setRecaptchaToken(null);
        return;
      }

      setEmailSent(true);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error("An unexpected error occurred");
      // Reset reCAPTCHA on error
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
  };

  const handleRecaptchaExpired = () => {
    setRecaptchaToken(null);
    toast.error("reCAPTCHA expired. Please verify again.");
  };

  const handleRecaptchaError = () => {
    setRecaptchaToken(null);
    toast.error("reCAPTCHA error. Please try again.");
  };

  const handleTryAgain = () => {
    setEmailSent(false);
    setEmail("");
    setRecaptchaToken(null);
    recaptchaRef.current?.reset();
  };

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            {emailSent ? "Check your email" : "Forgot your password?"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {emailSent ? (
              "We've sent you a password reset link"
            ) : (
              <>
                Or{" "}
                <Link
                  href="/auth/signin"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  return to sign in
                </Link>
              </>
            )}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {emailSent ? (
              // Success state
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Email sent successfully!
                </h3>
                <p className="text-gray-600 mb-6">
                  We've sent a password reset link to{" "}
                  <span className="font-medium text-gray-900">{email}</span>.
                  Please check your inbox and follow the instructions to reset
                  your password.
                </p>
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Didn't receive the email? Check your spam folder or try
                    again.
                  </p>
                  <div className="flex flex-col space-y-3">
                    <button
                      onClick={handleTryAgain}
                      className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Try another email
                    </button>
                    <Link
                      href="/auth/signin"
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Return to sign in
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              // Form state
              <>
                <div className="mb-6">
                  <p className="text-sm text-gray-600">
                    Enter your email address and we'll send you a link to reset
                    your password.
                  </p>
                </div>

                <form className="space-y-6" onSubmit={handleResetPassword}>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email address
                    </label>
                    <div className="mt-1">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>

                  {/* reCAPTCHA */}
                  <div className="space-y-4">
                    <ReCaptcha
                      ref={recaptchaRef}
                      onVerify={handleRecaptchaChange}
                      onExpired={handleRecaptchaExpired}
                      onError={handleRecaptchaError}
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={loading || !recaptchaToken}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Sending email..." : "Send reset email"}
                    </button>
                  </div>
                </form>

                <div className="mt-6">
                  <Link
                    href="/auth/signin"
                    className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-500"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to sign in
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
