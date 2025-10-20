"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  User,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface PendingRegistration {
  paymentReference: string;
  courseId: string;
  customerEmail: string;
  customerName: {
    firstName: string;
    lastName: string;
  };
}

interface RegistrationForm {
  password: string;
  confirmPassword: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
}

export default function PaymentFirstSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get("courseId");
  const paymentReference = searchParams.get("ref");
  const merchantOrderId = searchParams.get("merchantOrderId");

  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRedirectingToSignIn, setIsRedirectingToSignIn] = useState(false);
  const [pendingRegistration, setPendingRegistration] =
    useState<PendingRegistration | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [registrationForm, setRegistrationForm] = useState<RegistrationForm>({
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const initializeSuccessPage = async () => {
      try {
        setIsLoading(true);

        // Try to get payment reference from URL
        if (paymentReference) {
          // Verify payment using the reference from URL
          const paymentCheck = await verifyPayment(paymentReference);
          
          // Check if user already registered
          if (paymentCheck.alreadyRegistered) {
            setIsRedirectingToSignIn(true);
            setIsLoading(false);
            toast.success("You already have an account! Redirecting to sign in...");
            setTimeout(() => {
              router.push(`/auth/signin?email=${encodeURIComponent(paymentCheck.userEmail)}`);
            }, 1500);
            return;
          }
          
          if (paymentCheck.success) {
            await processPaymentData(paymentCheck.payment);
            return;
          }
        }

        // If no payment reference in URL or verification failed, try to find pending payment
        if (!courseId) {
          toast.error("Course ID is missing from URL");
          router.push("/");
          return;
        }

        
        // Try to find pending payment by merchant order ID first, then course ID
        let pendingData = null;
        
        if (merchantOrderId) {
          const merchantOrderResponse = await fetch(`/api/pembayaran/find-by-order?merchantOrderId=${merchantOrderId}`);
          if (merchantOrderResponse.ok) {
            pendingData = await merchantOrderResponse.json();
          }
        }
        
        if (!pendingData?.pendingPayment) {
          const pendingResponse = await fetch(`/api/pembayaran/find-pending?courseId=${courseId}`);
          if (pendingResponse.ok) {
            pendingData = await pendingResponse.json();
          }
        }
        
        if (pendingData?.pendingPayment) {
          const paymentCheck = await verifyPayment(pendingData.pendingPayment.stripePaymentId);
          
          // Check if user already registered
          if (paymentCheck.alreadyRegistered) {
            setIsRedirectingToSignIn(true);
            setIsLoading(false);
            toast.success("You already have an account! Redirecting to sign in...");
            setTimeout(() => {
              router.push(`/auth/signin?email=${encodeURIComponent(paymentCheck.userEmail)}`);
            }, 1500);
            return;
          }
          
          if (paymentCheck.success) {
            await processPaymentData(paymentCheck.payment);
            return;
          }
        }

        // If we reach here, no valid payment was found
        toast.error("No valid payment found. Please try again or contact support.");
        router.push("/complete-registration");
        return;

      } catch (error) {
        toast.error("Failed to load registration page");
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    const processPaymentData = async (paymentData: any) => {

      // Check if user already exists (meaning they already registered)
      const userCheck = await fetch(`/api/pembayaran/check-user?email=${paymentData.customerEmail}`);
      if (userCheck.ok) {
        const userData = await userCheck.json();
        if (userData.userExists) {
          toast.success("You already have an account. Redirecting to sign in...");
          router.push(`/auth/signin?email=${encodeURIComponent(paymentData.customerEmail)}`);
          return;
        }
      }

      // Set up registration data from payment verification
      const registrationData: PendingRegistration = {
        paymentReference: paymentData.reference,
        courseId: paymentData.course.id,
        customerEmail: paymentData.customerEmail,
        customerName: {
          firstName: paymentData.customerName?.split(' ')[0] || 'Customer',
          lastName: paymentData.customerName?.split(' ').slice(1).join(' ') || '',
        },
      };

      setPendingRegistration(registrationData);
      setPaymentVerified(true);
      setCourse(paymentData.course);

    };

    initializeSuccessPage();
  }, [courseId, paymentReference, merchantOrderId, router]);

  const verifyPayment = async (paymentReference: string) => {
    try {
      const response = await fetch("/api/pembayaran/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentReference }),
      });

      if (!response.ok) {
        throw new Error("Payment verification failed");
      }

      return await response.json();
    } catch (error) {
      return { success: false };
    }
  };

  const handleCompleteRegistration = async () => {
    if (!pendingRegistration) {
      toast.error("No registration data found");
      return;
    }

    // Validate form
    if (!registrationForm.password || registrationForm.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (registrationForm.password !== registrationForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setIsRegistering(true);

      // Create user account
      const registrationResponse = await fetch("/api/pembayaran/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentReference: pendingRegistration.paymentReference,
          customerInfo: {
            firstName: pendingRegistration.customerName.firstName,
            lastName: pendingRegistration.customerName.lastName,
            email: pendingRegistration.customerEmail,
            password: registrationForm.password,
          },
          courseId: pendingRegistration.courseId,
        }),
      });

      if (!registrationResponse.ok) {
        const errorData = await registrationResponse.json();
        throw new Error(errorData.error || "Registration failed");
      }

      const registrationResult = await registrationResponse.json();

      toast.success("Registration completed successfully!");

      // Sign in the user automatically
      const signInResponse = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: pendingRegistration.customerEmail,
          password: registrationForm.password,
        }),
      });

      if (signInResponse.ok) {
        toast.success("Welcome to your course!");
        router.push("/dashboard");
      } else {
        toast.success("Registration completed! Please sign in to continue.");
        router.push("/auth/signin");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Registration failed"
      );
    } finally {
      setIsRegistering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Verifying payment...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isRedirectingToSignIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Redirecting...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!paymentVerified || !pendingRegistration || !course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Payment Verification Failed
              </h2>
              <p className="text-gray-600 mb-4">
                Unable to verify your payment. Please contact support.
              </p>
              <button
                onClick={() => router.push("/")}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pembayaran kamu sudah berhasil! 🎉
            </h1>
          </div>

          {/* Payment Reference */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Nomor Referensi Pembayaran:</p>
              <p className="text-2xl font-mono font-bold text-blue-600">
                {pendingRegistration.paymentReference}
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 mb-4">
                Jika kamu sudah melakukan pembayaran, silakan <strong>cek email kamu</strong> (termasuk folder <em>Spam/Promotions</em>) untuk mendapatkan langkah selanjutnya dan link akses ke kelas.
              </p>

              <p className="text-gray-700 mb-3">
                Jika kamu sudah bayar tapi belum menerima email dalam waktu 15 menit:
              </p>

              <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Pastikan kamu menggunakan email yang sama saat checkout.</strong></li>
                <li>Cek juga folder spam.</li>
                <li>
                  Jika tetap belum ada, kirimkan bukti pembayaran ke{" "}
                  <a href="mailto:penirizki5@gmail.com" className="text-blue-600 hover:underline">
                    penirizki5@gmail.com
                  </a>{" "}
                  atau WA:{" "}
                  <a href="https://wa.me/6287863342502" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    +62 878-6334-2502
                  </a>{" "}
                  agar tim kami bisa bantu verifikasi manual.
                </li>
              </ol>

              <p className="text-gray-700 mb-2">
                Terima kasih sudah bergabung di <em>Learn With Peni</em>! 💛
              </p>

              <p className="text-gray-700">
                Kami tidak sabar melihat kamu mulai belajar dan berkembang!
              </p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Detail Pembayaran:</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="font-medium">{pendingRegistration.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span>Nama:</span>
                <span className="font-medium">
                  {pendingRegistration.customerName.firstName}{" "}
                  {pendingRegistration.customerName.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Kursus:</span>
                <span className="font-medium">{course.title}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span>Total Dibayar:</span>
                <span className="font-bold text-green-600">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(course.price)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
