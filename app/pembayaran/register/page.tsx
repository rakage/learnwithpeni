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

export default function PembayaranRegisterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentReference = searchParams.get("ref");
  const courseId = searchParams.get("courseId");

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
    const initializeRegistrationPage = async () => {
      try {
        setIsLoading(true);

        if (!paymentReference || !courseId) {
          toast.error("Link tidak valid. Harap gunakan link dari email.");
          router.push("/complete-registration");
          return;
        }

        // Verify payment using the reference
        const paymentCheck = await verifyPayment(paymentReference);
        
        // Check if user already registered
        if (paymentCheck.alreadyRegistered) {
          setIsRedirectingToSignIn(true);
          setIsLoading(false);
          toast.success("Kamu sudah memiliki akun! Silakan login.");
          setTimeout(() => {
            router.push(`/auth/signin?email=${encodeURIComponent(paymentCheck.userEmail)}`);
          }, 1500);
          return;
        }
        
        if (paymentCheck.success) {
          await processPaymentData(paymentCheck.payment);
          return;
        }

        // If we reach here, no valid payment was found
        toast.error("Pembayaran tidak ditemukan atau belum selesai.");
        router.push("/complete-registration");
        return;

      } catch (error) {
        toast.error("Gagal memuat halaman pendaftaran");
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    const processPaymentData = async (paymentData: any) => {
      // Check if user already exists
      const userCheck = await fetch(`/api/pembayaran/check-user?email=${paymentData.customerEmail}`);
      if (userCheck.ok) {
        const userData = await userCheck.json();
        if (userData.userExists) {
          toast.success("Kamu sudah memiliki akun. Silakan login.");
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

    initializeRegistrationPage();
  }, [paymentReference, courseId, router]);

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
        throw new Error("Verifikasi pembayaran gagal");
      }

      return await response.json();
    } catch (error) {
      return { success: false };
    }
  };

  const handleCompleteRegistration = async () => {
    if (!pendingRegistration) {
      toast.error("Data pendaftaran tidak ditemukan");
      return;
    }

    // Validate form
    if (!registrationForm.password || registrationForm.password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    if (registrationForm.password !== registrationForm.confirmPassword) {
      toast.error("Password tidak cocok");
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
        throw new Error(errorData.error || "Pendaftaran gagal");
      }

      const registrationResult = await registrationResponse.json();

      toast.success("Pendaftaran berhasil!");

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
        toast.success("Selamat datang! Menuju ke kursus kamu...");
        router.push("/dashboard");
      } else {
        toast.success("Pendaftaran selesai! Silakan login untuk melanjutkan.");
        router.push("/auth/signin");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Pendaftaran gagal"
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
              <p>Memverifikasi pembayaran...</p>
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
              <p>Mengalihkan ke halaman login...</p>
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
                Verifikasi Pembayaran Gagal
              </h2>
              <p className="text-gray-600 mb-4">
                Tidak dapat memverifikasi pembayaran kamu. Silakan hubungi support.
              </p>
              <button
                onClick={() => router.push("/")}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Kembali ke Beranda
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
              Pembayaran Berhasil! 🎉
            </h1>
            <p className="text-gray-600">
              Selesaikan pendaftaran untuk mengakses kursus kamu
            </p>
          </div>

          {/* Payment Reference */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Nomor Referensi Pembayaran:</p>
              <p className="text-xl font-mono font-bold text-blue-600">
                {pendingRegistration.paymentReference}
              </p>
            </div>
          </div>

          {/* Course Info */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Kursus yang Dibeli
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{course.title}</h3>
                <p className="text-gray-600 text-sm">{course.description}</p>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Jumlah Dibayar:</span>
                  <span className="text-xl font-bold text-green-600">
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

          {/* Registration Form */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              Selesaikan Pendaftaran Akun
            </h2>
            <div className="space-y-4">
              <p className="text-gray-600">
                Akun kamu akan dibuat dengan informasi berikut:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Nama:</span>{" "}
                    {pendingRegistration.customerName.firstName}{" "}
                    {pendingRegistration.customerName.lastName}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>{" "}
                    {pendingRegistration.customerEmail}
                  </div>
                </div>
              </div>
              
              {/* Password Setup */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Buat Password Akun</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={registrationForm.password}
                      onChange={(e) => setRegistrationForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Minimal 6 karakter"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Konfirmasi Password *
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={registrationForm.confirmPassword}
                      onChange={(e) => setRegistrationForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Konfirmasi password"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Langkah Selanjutnya:
                </h4>
                <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
                  <li>Atur password baru dan konfirmasi password yang kamu buat</li>
                  <li>Klik "Complete Registration & Access Course"</li>
                  <li>Selanjutnya, silakan Sign In menggunakan email dan password yang sudah dibuat</li>
                  <li>Setelah berhasil login, kamu akan masuk ke Dashboard Course</li>
                  <li>Yeay! Kamu sudah bisa akses materi dan mulai belajar 🚀</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleCompleteRegistration}
            disabled={isRegistering}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 px-6 rounded-lg font-semibold flex items-center justify-center text-lg"
          >
            {isRegistering ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Membuat Akun Kamu...
              </>
            ) : (
              <>
                Complete Registration & Access Course
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            Dengan melanjutkan pendaftaran, kamu menyetujui syarat dan ketentuan serta kebijakan privasi kami.
          </p>
        </div>
      </div>
    </div>
  );
}
