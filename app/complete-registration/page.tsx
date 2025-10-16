"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function CompleteRegistrationPage() {
  const [paymentReference, setPaymentReference] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const router = useRouter();

  const handleCheckPayment = async () => {
    if (!paymentReference.trim()) {
      toast.error("Please enter your payment reference");
      return;
    }

    try {
      setIsChecking(true);

      // Verify payment using reference
      const response = await fetch(`/api/pembayaran/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentReference: paymentReference.trim() })
      });
      
      if (!response.ok) {
        throw new Error("Failed to verify payment");
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success("Payment found! Redirecting to complete registration...");
        router.push(`/pembayaran/success?ref=${paymentReference.trim()}&courseId=${data.payment.course.id}`);
      } else if (data.alreadyRegistered) {
        // User already registered, redirect to login
        toast.success(`You already have an account! Redirecting to sign in...`);
        setTimeout(() => {
          router.push(`/auth/signin?email=${encodeURIComponent(data.userEmail)}`);
        }, 1500);
      } else {
        toast.error("Payment not found or not completed. Please check your payment reference.");
      }
    } catch (error) {
      console.error("Error checking payment:", error);
      toast.error("Failed to verify payment. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Complete Registration
            </h1>
            <p className="text-gray-600">
              If you've completed payment but weren't automatically redirected, you can complete your registration here.
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="paymentReference" className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Reference *
                </label>
                <input
                  id="paymentReference"
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Enter your payment reference (e.g. DK-12345678)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can find this in your payment confirmation email or Duitku receipt
                </p>
              </div>

              <button
                onClick={handleCheckPayment}
                disabled={isChecking || !paymentReference.trim()}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Checking Payment...
                  </>
                ) : (
                  <>
                    Check Payment & Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">Need Help?</h3>
            <p className="text-yellow-700 text-sm">
              If you've made a payment but can't find your payment reference, please check your email confirmation or contact support.
            </p>
          </div>

          {/* Already Registered Section */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Already Have an Account?</h3>
            <p className="text-blue-700 text-sm mb-3">
              If you've already completed registration for your course, please sign in to access it.
            </p>
            <button
              onClick={() => router.push('/auth/signin')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center"
            >
              Sign In to Your Account
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
