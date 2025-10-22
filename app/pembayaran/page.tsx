"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import {
  Loader2,
  CreditCard,
  Smartphone,
  Building2,
  QrCode,
  AlertCircle,
  CheckCircle,
  Store,
  ChevronDown,
  ChevronUp,
  Shield,
  Download,
  Heart,
  Sparkles,
  GraduationCap,
  Lock,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Image from "next/image";

interface PaymentMethod {
  paymentMethod: string;
  paymentName: string;
  paymentImage: string;
  totalFee: string;
  displayName: string;
  formattedFee: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  modules?: Array<{
    id: string;
    title: string;
    type: string;
  }>;
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  city: string;
  postalCode: string;
  email: string;
}

interface PaymentMethodGroup {
  id: string;
  title: string;
  icon: React.ReactNode;
  methods: PaymentMethod[];
  isExpanded: boolean;
}

export default function PembayaranPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get("courseId");

  const [course, setCourse] = useState<Course | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentGroups, setPaymentGroups] = useState<PaymentMethodGroup[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>("");

  // Debug function to track payment method selection
  const handlePaymentMethodSelection = (paymentMethod: string) => {
    setSelectedMethod(paymentMethod);
  };
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    address: "",
    city: "Jakarta",
    postalCode: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Calculate fees
  const calculateFees = (basePrice: number) => {
    const totalAmount = Math.round(basePrice);

    return {
      basePrice,
      totalAmount,
    };
  };

  useEffect(() => {
    if (!courseId) {
      toast.error("No course selected");
      router.push("/");
      return;
    }

    loadPaymentData();
  }, [courseId]);

  const loadPaymentData = async () => {
    try {
      setIsLoading(true);

      // Get payment methods for the course (without authentication)
      const methodsResponse = await fetch(
        `/api/pembayaran/methods?courseId=${courseId}`
      );

      if (!methodsResponse.ok) {
        throw new Error("Failed to load payment methods");
      }

      const methodsData = await methodsResponse.json();
      setPaymentMethods(methodsData.paymentMethods);

      // Group payment methods
      groupPaymentMethods(methodsData.paymentMethods);

      // Get course details
      const courseResponse = await fetch(`/api/courses/${courseId}/public`);
      if (courseResponse.ok) {
        const courseData = await courseResponse.json();
        setCourse(courseData.course);
      }
    } catch (error) {
      console.error("Error loading payment data:", error);
      toast.error("Failed to load payment options");
    } finally {
      setIsLoading(false);
    }
  };

  const groupPaymentMethods = (methods: PaymentMethod[]) => {
    const groups: PaymentMethodGroup[] = [
      {
        id: "virtual-account",
        title: "Virtual Account",
        icon: <Building2 className="w-5 h-5" />,
        methods: [],
        isExpanded: true,
      },
      {
        id: "e-wallet",
        title: "E-Wallet",
        icon: <Smartphone className="w-5 h-5" />,
        methods: [],
        isExpanded: false,
      },
      {
        id: "retail",
        title: "Retail Store",
        icon: <Store className="w-5 h-5" />,
        methods: [],
        isExpanded: false,
      },
      {
        id: "qris",
        title: "QRIS",
        icon: <QrCode className="w-5 h-5" />,
        methods: [],
        isExpanded: false,
      },
      {
        id: "credit-card",
        title: "Credit Card",
        icon: <CreditCard className="w-5 h-5" />,
        methods: [],
        isExpanded: false,
      },
      {
        id: "paylater",
        title: "Buy Now Pay Later",
        icon: <CreditCard className="w-5 h-5" />,
        methods: [],
        isExpanded: false,
      },
    ];

    methods.forEach((method) => {
      const methodCode = method.paymentMethod.toUpperCase();

      // Virtual Account
      if (
        [
          "BC",
          "M2",
          "VA",
          "I1",
          "B1",
          "BT",
          "A1",
          "AG",
          "NC",
          "BR",
          "S1",
          "DM",
          "BV",
        ].includes(methodCode)
      ) {
        groups[0].methods.push(method);
      }
      // E-Wallet
      else if (
        ["OV", "SA", "LF", "LA", "DA", "SL", "OL", "JP"].includes(methodCode)
      ) {
        groups[1].methods.push(method);
      }
      // Retail Store
      else if (["FT", "IR"].includes(methodCode)) {
        groups[2].methods.push(method);
      }
      // QRIS
      else if (["SP", "NQ", "DQ", "GQ", "SQ", "LQ"].includes(methodCode)) {
        groups[3].methods.push(method);
      }
      // Credit Card
      else if (["VC"].includes(methodCode)) {
        groups[4].methods.push(method);
      }
      // Buy Now Pay Later
      else if (["DN", "AT"].includes(methodCode)) {
        groups[5].methods.push(method);
      } else {
        // Default to virtual account group for unknown codes
        groups[0].methods.push(method);
      }
    });

    // Filter out empty groups
    const filteredGroups = groups.filter((group) => group.methods.length > 0);
    setPaymentGroups(filteredGroups);
  };

  const toggleGroup = (groupId: string) => {
    setPaymentGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    );
  };

  const validateForm = () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return false;
    }

    if (
      !customerInfo.firstName ||
      !customerInfo.phoneNumber ||
      !customerInfo.email
    ) {
      toast.error("Please fill in all required fields");
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsProcessing(true);

      const paymentData = {
        courseId,
        paymentMethod: selectedMethod,
        customerInfo: {
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          phoneNumber: customerInfo.phoneNumber,
          address: customerInfo.address,
          city: customerInfo.city,
          postalCode: customerInfo.postalCode,
          email: customerInfo.email,
        },
      };

      const response = await fetch("/api/pembayaran/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Payment creation failed");
      }

      const result = await response.json();

      toast.success("Payment created successfully!");
      setIsProcessing(false);
      setIsRedirecting(true);

      // Add a small delay to show the redirect message
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to payment URL or show payment details
      // The success page will be reached via return URL from Duitku with payment reference
      if (result.payment.paymentUrl) {
        window.location.href = result.payment.paymentUrl;
      } else {
        // Fallback: redirect to success page with payment reference
        router.push(
          `/pembayaran/success?ref=${result.payment.reference}&courseId=${courseId}`
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment failed");
      setIsProcessing(false);
      setIsRedirecting(false);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    const methodUpper = method.toUpperCase();

    if (
      [
        "BC",
        "M2",
        "VA",
        "I1",
        "B1",
        "BT",
        "A1",
        "AG",
        "NC",
        "BR",
        "S1",
        "DM",
        "BV",
      ].includes(methodUpper)
    ) {
      return <Building2 className="w-6 h-6" />;
    } else if (
      ["OV", "SA", "LF", "LA", "DA", "SL", "OL", "JP"].includes(methodUpper)
    ) {
      return <Smartphone className="w-6 h-6" />;
    } else if (["FT", "IR"].includes(methodUpper)) {
      return <Store className="w-6 h-6" />;
    } else if (["SP", "NQ", "DQ", "GQ", "SQ", "LQ"].includes(methodUpper)) {
      return <QrCode className="w-6 h-6" />;
    } else if (["VC"].includes(methodUpper)) {
      return <CreditCard className="w-6 h-6" />;
    } else if (["DN", "AT"].includes(methodUpper)) {
      return <CreditCard className="w-6 h-6" />;
    }

    return <CreditCard className="w-6 h-6" />;
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen"
        style={{
          background: "linear-gradient(135deg, #FFF0F5 0%, #FFB6C1 100%)",
        }}
      >
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
              <h2
                className="text-2xl font-bold mb-2"
                style={{
                  fontFamily: "Poppins, sans-serif",
                  background: "linear-gradient(135deg, #FF69B4, #9966CC)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Loading Your Remote Work Journey ✨
              </h2>
              <p
                className="text-purple-600"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Preparing your career transformation...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div
        className="min-h-screen"
        style={{
          background: "linear-gradient(135deg, #FFF0F5 0%, #FFB6C1 100%)",
        }}
      >
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-pink-500" />
              </div>
              <h2
                className="text-3xl font-bold mb-4"
                style={{
                  fontFamily: "Poppins, sans-serif",
                  background: "linear-gradient(135deg, #FF69B4, #9966CC)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Oops! Course Not Found 😢
              </h2>
              <p
                className="text-purple-600 mb-6 max-w-md mx-auto"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                The course you're trying to purchase could not be found. Don't
                worry, let's get you back on track!
              </p>
              <button
                onClick={() => router.push("/")}
                className="px-8 py-3 text-white font-semibold rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl"
                style={{
                  background: "linear-gradient(135deg, #FF69B4, #9966CC)",
                  boxShadow: "0 4px 15px rgba(255, 105, 180, 0.3)",
                  fontFamily: "Poppins, sans-serif",
                }}
              >
                ← Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const fees = calculateFees(course.price);

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(135deg, #FFF0F5 0%, #FFB6C1 100%)",
      }}
    >
      <Navigation />

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 opacity-10">
          <Heart className="w-full h-full text-pink-400" />
        </div>
        <div className="absolute top-40 right-20 w-16 h-16 opacity-10">
          <Sparkles className="w-full h-full text-purple-400" />
        </div>
        <div className="absolute bottom-40 left-20 w-24 h-24 opacity-10">
          <Sparkles className="w-full h-full text-pink-300" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Hero Header */}
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <div className="flex items-center gap-2 bg-gradient-to-r from-pink-100 to-purple-100 px-6 py-2 rounded-full border border-pink-200">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span className="text-sm font-medium text-purple-700">
                  Limited Time: Save 80% Today Only!
                </span>
                <Sparkles className="w-4 h-4 text-pink-500" />
              </div>
            </div>
            <h1
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{
                fontFamily: "Poppins, sans-serif",
                background: "linear-gradient(135deg, #FF69B4, #9966CC)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {course.title || "Start Your Remote Work Career Journey!"} ❤️
            </h1>
            <p
              className="text-xl text-gray-700 mb-6 max-w-2xl mx-auto"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {course.description || "Master remote work skills with internationally recognized certification + job-ready templates"}
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-pink-500" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-500" />
                <span>1000+ Happy Students</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Main Content - Course Details */}
            <div className="space-y-6">
              {/* Pricing Highlight Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-pink-100 p-8 relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    80% OFF
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline gap-4 mb-2">
                    <span className="text-3xl font-bold text-gray-400 line-through">
                      Rp 1.999.000
                    </span>
                    <span className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                      Rp {course.price.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    One-time payment • Lifetime access
                  </p>
                </div>
              </div>

              {/* Course Overview */}
              <div className="bg-white rounded-2xl shadow-lg border border-pink-100 p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <GraduationCap className="w-6 h-6 text-pink-500" />
                  What You'll Get:
                </h3>

                {/* Course Content - Video Modules */}
                {course.modules && course.modules.filter((m: any) => m.type === 'VIDEO').length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-purple-700 mb-4 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      Course Content
                    </h4>
                    <div className="space-y-3">
                      {course.modules
                        .filter((m: any) => m.type === 'VIDEO')
                        .map((module: any, index: number) => (
                          <div key={module.id} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-gray-700">{module.title}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Templates & Resources - Text and File Modules */}
                {course.modules && course.modules.filter((m: any) => m.type === 'TEXT' || m.type === 'FILE').length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-purple-700 mb-4 flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      Templates & Resources
                    </h4>
                    <div className="space-y-3">
                      {course.modules
                        .filter((m: any) => m.type === 'TEXT' || m.type === 'FILE')
                        .map((module: any, index: number) => (
                          <div key={module.id} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-gray-700">{module.title}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Form */}
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="bg-white rounded-2xl shadow-lg border border-pink-100 p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                  <Heart className="w-6 h-6 text-pink-500" />
                  Your Information
                </h2>
                <p className="text-gray-600 mb-6">
                  Just a few details to get you started ✨
                </p>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        First Name *
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        value={customerInfo.firstName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setCustomerInfo((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        placeholder="Nama depan"
                        required
                        className="w-full px-4 py-3 bg-pink-50 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-pink-400 transition-all duration-300"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={customerInfo.lastName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setCustomerInfo((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        placeholder="Nama belakang"
                        className="w-full px-4 py-3 bg-pink-50 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-pink-400 transition-all duration-300"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Email Address *
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setCustomerInfo((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="nama@email.com"
                      required
                      className="w-full px-4 py-3 bg-pink-50 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-pink-400 transition-all duration-300"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phoneNumber"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Phone Number *
                    </label>
                    <input
                      id="phoneNumber"
                      type="text"
                      value={customerInfo.phoneNumber}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setCustomerInfo((prev) => ({
                          ...prev,
                          phoneNumber: e.target.value,
                        }))
                      }
                      placeholder="081234567890"
                      required
                      className="w-full px-4 py-3 bg-pink-50 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-pink-400 transition-all duration-300"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="address"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Address (Optional)
                    </label>
                    <input
                      id="address"
                      type="text"
                      value={customerInfo.address}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setCustomerInfo((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      placeholder="Alamat lengkap"
                      className="w-full px-4 py-3 bg-pink-50 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-pink-400 transition-all duration-300"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="city"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        City
                      </label>
                      <input
                        id="city"
                        type="text"
                        value={customerInfo.city}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setCustomerInfo((prev) => ({
                            ...prev,
                            city: e.target.value,
                          }))
                        }
                        placeholder="Jakarta"
                        className="w-full px-4 py-3 bg-pink-50 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-pink-400 transition-all duration-300"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="postalCode"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Postal Code
                      </label>
                      <input
                        id="postalCode"
                        type="text"
                        value={customerInfo.postalCode}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setCustomerInfo((prev) => ({
                            ...prev,
                            postalCode: e.target.value,
                          }))
                        }
                        placeholder="12345"
                        className="w-full px-4 py-3 bg-pink-50 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-pink-400 transition-all duration-300"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-white rounded-2xl shadow-lg border border-pink-100 p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-pink-500" />
                  Choose Payment Method
                </h2>
                <p className="text-gray-600 mb-6">
                  Select your preferred way to pay 💖
                </p>

                {paymentGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-pink-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No payment methods available
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentGroups.map((group) => (
                      <div
                        key={group.id}
                        className="border-2 border-purple-100 rounded-xl overflow-hidden"
                      >
                        {/* Group Header */}
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 transition-all duration-300"
                          onClick={() => toggleGroup(group.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center">
                              {React.cloneElement(
                                group.icon as React.ReactElement,
                                { className: "w-5 h-5 text-white" }
                              )}
                            </div>
                            <span className="font-semibold text-gray-800">
                              {group.title}
                            </span>
                            <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
                              {group.methods.length}{" "}
                              {group.methods.length === 1
                                ? "option"
                                : "options"}
                            </span>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                            {group.isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-purple-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-purple-500" />
                            )}
                          </div>
                        </div>

                        {/* Group Methods */}
                        {group.isExpanded && (
                          <div className="p-4 bg-white space-y-3">
                            {group.methods.map((method) => {
                              const isSelected =
                                selectedMethod === method.paymentMethod;
                              return (
                                <div
                                  key={method.paymentMethod}
                                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 select-none ${
                                    isSelected
                                      ? "border-pink-400 bg-gradient-to-r from-pink-50 to-purple-50 shadow-md ring-2 ring-pink-200"
                                      : "border-purple-100 hover:border-purple-300 hover:shadow-sm hover:bg-gradient-to-r hover:from-pink-25 hover:to-purple-25"
                                  }`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handlePaymentMethodSelection(
                                      method.paymentMethod
                                    );
                                  }}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      handlePaymentMethodSelection(
                                        method.paymentMethod
                                      );
                                    }
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <div
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                          isSelected
                                            ? "bg-gradient-to-r from-pink-200 to-purple-200"
                                            : "bg-gradient-to-r from-pink-100 to-purple-100"
                                        }`}
                                      >
                                        {getPaymentMethodIcon(
                                          method.paymentMethod
                                        )}
                                      </div>
                                      <div>
                                        <div className="font-semibold text-gray-800">
                                          {method.displayName}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                          {method.paymentName}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                      <div className="text-right">
                                        <div
                                          className={`text-sm font-semibold transition-colors duration-200 ${
                                            isSelected
                                              ? "text-pink-600"
                                              : "text-purple-700"
                                          }`}
                                        >
                                          Fee: {method.formattedFee}
                                        </div>
                                      </div>
                                      {method.paymentImage && (
                                        <Image
                                          src={method.paymentImage}
                                          alt={method.paymentName}
                                          width={40}
                                          height={25}
                                          className="object-contain rounded pointer-events-none"
                                        />
                                      )}
                                      <div
                                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                          isSelected
                                            ? "border-pink-500 bg-gradient-to-r from-pink-500 to-purple-500 shadow-lg scale-110"
                                            : "border-gray-300 bg-white hover:border-pink-300"
                                        }`}
                                      >
                                        {isSelected ? (
                                          <CheckCircle className="w-4 h-4 text-white animate-in fade-in zoom-in duration-200" />
                                        ) : (
                                          <div className="w-3 h-3 rounded-full bg-gray-200 transition-all duration-200" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                disabled={
                  !selectedMethod ||
                  isProcessing ||
                  isRedirecting ||
                  !customerInfo.firstName ||
                  !customerInfo.phoneNumber ||
                  !customerInfo.email
                }
                className="w-full py-3 sm:py-4 px-4 sm:px-8 text-white font-bold text-sm sm:text-base lg:text-lg rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background:
                    isProcessing ||
                    isRedirecting ||
                    !selectedMethod ||
                    !customerInfo.firstName ||
                    !customerInfo.phoneNumber ||
                    !customerInfo.email
                      ? "#9CA3AF"
                      : "linear-gradient(135deg, #FF69B4, #9966CC)",
                  boxShadow: "0 4px 15px rgba(255, 105, 180, 0.3)",
                  fontFamily: "Poppins, sans-serif",
                }}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2 sm:mr-3 flex-shrink-0" />
                    <span className="truncate">Processing Payment...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
                    <span className="truncate">
                      <span className="hidden sm:inline">
                        Start My Remote Work Journey
                      </span>
                      <span className="sm:hidden">
                        Start Remote Work Journey
                      </span>
                    </span>
                  </div>
                )}
              </button>

              {/* Security & How it Works */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-100 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <h4
                    className="font-bold text-purple-800"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    How it works:
                  </h4>
                </div>
                <ol className="text-purple-700 space-y-2 list-decimal list-inside">
                  <li className="flex items-start gap-2">
                    <span className="font-medium">1.</span>
                    <span>Complete payment using your chosen method</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">2.</span>
                    <span>After payment verification, create your account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">3.</span>
                    <span>Set up your password and complete registration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">4.</span>
                    <span>Get immediate access to your course! 🎉</span>
                  </li>
                </ol>
                <div className="mt-4 pt-4 border-t border-pink-200">
                  <p className="text-sm text-purple-600 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium">
                      Your payment information is 100% secure and encrypted
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Redirect Loading Overlay */}
      {isRedirecting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center mx-auto mb-6 animate-pulse">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-300 to-purple-300 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-200 to-purple-200 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white animate-spin" />
                </div>
              </div>
            </div>
            <h3
              className="text-2xl font-bold mb-4"
              style={{
                fontFamily: "Poppins, sans-serif",
                background: "linear-gradient(135deg, #FF69B4, #9966CC)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Almost There! 🚀
            </h3>
            <p
              className="text-gray-600 mb-6"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Redirecting you to the secure payment gateway...
            </p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
            <p
              className="text-sm text-gray-500 mt-4"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Please do not close this window
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
