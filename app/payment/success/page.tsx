"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, BookOpen } from "lucide-react";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Auto-redirect to dashboard after 5 seconds
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="flex justify-center">
            <CheckCircle className="h-24 w-24 text-green-500" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Payment Successful!
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Welcome to Remote Work Mastery
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            What happens next?
          </h3>
          <div className="space-y-3 text-left">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <span className="text-gray-700">
                You now have lifetime access to the complete course
              </span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <span className="text-gray-700">
                All course materials are available in your dashboard
              </span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <span className="text-gray-700">
                You'll receive a confirmation email shortly
              </span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <span className="text-gray-700">
                Start learning immediately at your own pace
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="w-full bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
          >
            <BookOpen className="h-5 w-5" />
            <span>Go to Dashboard</span>
          </Link>

          <p className="text-sm text-gray-500">
            You'll be automatically redirected in a few seconds...
          </p>
        </div>

        {sessionId && (
          <div className="text-xs text-gray-400">
            Transaction ID: {sessionId}
          </div>
        )}
      </div>
    </div>
  );
}
