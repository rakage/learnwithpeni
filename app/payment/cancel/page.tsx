"use client";

import Link from "next/link";
import { XCircle, CreditCard, ArrowLeft } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="flex justify-center">
            <XCircle className="h-24 w-24 text-red-500" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Payment Cancelled
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Your payment was not processed
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            What happened?
          </h3>
          <div className="space-y-3 text-left text-gray-700">
            <p>
              You cancelled the payment process or closed the payment window
              before completing your purchase.
            </p>
            <p>Don't worry - no charges were made to your card.</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Still want to join?
          </h3>
          <p className="text-gray-700 mb-4">
            Remote Work Mastery is waiting for you! Join thousands of students
            who have transformed their remote work skills.
          </p>
          <div className="flex items-center justify-center text-sm text-gray-600 space-x-4">
            <span>✓ 30-day money-back guarantee</span>
            <span>✓ Lifetime access</span>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            href="/payment"
            className="w-full bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
          >
            <CreditCard className="h-5 w-5" />
            <span>Try Payment Again</span>
          </Link>

          <Link
            href="/"
            className="w-full bg-white border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Homepage</span>
          </Link>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">
            Need help? Contact our support team
          </p>
          <a
            href="mailto:support@learnwithpeni.com"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            support@learnwithpeni.com
          </a>
        </div>
      </div>
    </div>
  );
}
