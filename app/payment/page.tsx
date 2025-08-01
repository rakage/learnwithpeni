"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import AuthGuard from "@/components/AuthGuard";
import { apiGet, apiPost } from "@/lib/auth-client";
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
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  city: string;
  postalCode: string;
}

interface PaymentMethodGroup {
  id: string;
  title: string;
  icon: React.ReactNode;
  methods: PaymentMethod[];
  isExpanded: boolean;
}

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get("courseId");

  const [course, setCourse] = useState<Course | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentGroups, setPaymentGroups] = useState<PaymentMethodGroup[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    address: "",
    city: "Jakarta",
    postalCode: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate fees
  const calculateFees = (basePrice: number) => {
    const taxAmount = Math.round(basePrice * 0.01);
    const serviceFee = Math.round(basePrice * 0.05);
    const totalAmount = Math.round(basePrice + taxAmount + serviceFee);

    return {
      basePrice,
      taxAmount,
      serviceFee,
      totalAmount,
    };
  };

  useEffect(() => {
    if (!courseId) {
      toast.error("No course selected");
      router.push("/dashboard");
      return;
    }

    loadPaymentData();
  }, [courseId]);

  const loadPaymentData = async () => {
    try {
      setIsLoading(true);

      // Get payment methods for the course
      const methodsResponse = await apiGet(
        `/api/payment/duitku/methods?courseId=${courseId}`
      );

      if (!methodsResponse.ok) {
        throw new Error("Failed to load payment methods");
      }

      const methodsData = await methodsResponse.json();
      setPaymentMethods(methodsData.paymentMethods);

      // Group payment methods
      groupPaymentMethods(methodsData.paymentMethods);

      // Get course details from the methods response or fetch separately
      const courseResponse = await apiGet(`/api/courses/${courseId}`);
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
        isExpanded: true, // First group expanded by default
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

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (!customerInfo.firstName || !customerInfo.phoneNumber) {
      toast.error("Please fill in required customer information");
      return;
    }

    try {
      setIsProcessing(true);

      const paymentData = {
        courseId,
        paymentMethod: selectedMethod,
        customerInfo,
      };

      const response = await apiPost(
        "/api/payment/duitku/checkout",
        paymentData
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Payment creation failed");
      }

      const result = await response.json();

      console.log("Payment created:", result);
      toast.success("Payment created successfully!");

      // Redirect to payment URL or show payment details
      if (result.payment.paymentUrl) {
        // Redirect to Duitku payment page
        window.location.href = result.payment.paymentUrl;
      } else {
        // Show payment details (VA number, QR code, etc.)
        router.push(
          `/payment/details?orderId=${result.payment.merchantOrderId}`
        );
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    const methodUpper = method.toUpperCase();

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
      ].includes(methodUpper)
    ) {
      return <Building2 className="w-6 h-6" />;
    }
    // E-Wallet
    else if (
      ["OV", "SA", "LF", "LA", "DA", "SL", "OL", "JP"].includes(methodUpper)
    ) {
      return <Smartphone className="w-6 h-6" />;
    }
    // Retail Store
    else if (["FT", "IR"].includes(methodUpper)) {
      return <Store className="w-6 h-6" />;
    }
    // QRIS
    else if (["SP", "NQ", "DQ", "GQ", "SQ", "LQ"].includes(methodUpper)) {
      return <QrCode className="w-6 h-6" />;
    }
    // Credit Card
    else if (["VC"].includes(methodUpper)) {
      return <CreditCard className="w-6 h-6" />;
    }
    // Buy Now Pay Later
    else if (["DN", "AT"].includes(methodUpper)) {
      return <CreditCard className="w-6 h-6" />;
    }

    return <CreditCard className="w-6 h-6" />;
  };

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p>Loading payment options...</p>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!course) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Course Not Found</h2>
                <p className="text-gray-600 mb-4">
                  The course you're trying to purchase could not be found.
                </p>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const fees = calculateFees(course.price);

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Complete Your Purchase
              </h1>
              <p className="text-gray-600">
                Choose your preferred payment method to access the course
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Course Summary */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <h2 className="text-xl font-semibold">Course Summary</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{course.title}</h3>
                    <p className="text-gray-600 text-sm">
                      {course.description}
                    </p>
                  </div>

                  {/* Price Breakdown */}
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Course Price:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }).format(fees.basePrice)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tax (1%):</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }).format(fees.taxAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Service Fee (5%):</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }).format(fees.serviceFee)}
                      </span>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">
                          Total Amount:
                        </span>
                        <span className="text-2xl font-bold text-blue-600">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                          }).format(fees.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">
                      What you'll get:
                    </h4>
                    <ul className="text-blue-800 text-sm space-y-1">
                      <li>✓ Lifetime access to course materials</li>
                      <li>✓ Video lessons and downloadable resources</li>
                      <li>✓ Track your learning progress</li>
                      <li>✓ Certificate of completion</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <div className="space-y-6">
                {/* Customer Information */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-2">
                    Customer Information
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Please provide your details for the payment
                  </p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="firstName"
                          className="block text-sm font-medium text-gray-700 mb-1"
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
                          placeholder="John"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="lastName"
                          className="block text-sm font-medium text-gray-700 mb-1"
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
                          placeholder="Doe"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="phoneNumber"
                        className="block text-sm font-medium text-gray-700 mb-1"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="address"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Address
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
                        placeholder="Street address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="city"
                          className="block text-sm font-medium text-gray-700 mb-1"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="postalCode"
                          className="block text-sm font-medium text-gray-700 mb-1"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Methods - Grouped */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-2">Payment Method</h2>
                  <p className="text-gray-600 mb-4">
                    Choose your preferred payment option
                  </p>

                  {paymentGroups.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        No payment methods available
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paymentGroups.map((group) => (
                        <div
                          key={group.id}
                          className="border border-gray-200 rounded-lg"
                        >
                          {/* Group Header */}
                          <div
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => toggleGroup(group.id)}
                          >
                            <div className="flex items-center gap-3">
                              {group.icon}
                              <span className="font-medium text-gray-900">
                                {group.title}
                              </span>
                              <span className="text-sm text-gray-500">
                                ({group.methods.length}{" "}
                                {group.methods.length === 1
                                  ? "option"
                                  : "options"}
                                )
                              </span>
                            </div>
                            {group.isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>

                          {/* Group Methods */}
                          {group.isExpanded && (
                            <div className="border-t border-gray-200 p-4 space-y-2">
                              {group.methods.map((method) => (
                                <div
                                  key={method.paymentMethod}
                                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                                    selectedMethod === method.paymentMethod
                                      ? "border-blue-500 bg-blue-50"
                                      : "border-gray-200 hover:border-gray-300"
                                  }`}
                                  onClick={() =>
                                    setSelectedMethod(method.paymentMethod)
                                  }
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      {getPaymentMethodIcon(
                                        method.paymentMethod
                                      )}
                                      <div>
                                        <div className="font-medium text-sm">
                                          {method.displayName}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          {method.paymentName}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      <div className="text-right">
                                        <div className="text-xs font-medium">
                                          Fee: {method.formattedFee}
                                        </div>
                                      </div>
                                      {method.paymentImage && (
                                        <Image
                                          src={method.paymentImage}
                                          alt={method.paymentName}
                                          width={32}
                                          height={20}
                                          className="object-contain"
                                        />
                                      )}
                                      <div
                                        className={`w-4 h-4 rounded-full border-2 ${
                                          selectedMethod ===
                                          method.paymentMethod
                                            ? "border-blue-500 bg-blue-500"
                                            : "border-gray-300"
                                        }`}
                                      >
                                        {selectedMethod ===
                                          method.paymentMethod && (
                                          <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
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
                    !customerInfo.firstName ||
                    !customerInfo.phoneNumber
                  }
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing Payment...
                    </>
                  ) : (
                    `Pay ${new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(fees.totalAmount)}`
                  )}
                </button>

                <p className="text-center text-sm text-gray-600">
                  By continuing, you agree to our terms of service and privacy
                  policy. Your payment is secure and encrypted.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
