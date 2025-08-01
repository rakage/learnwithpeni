import { NextRequest, NextResponse } from "next/server";
import { DuitkuHelper } from "@/lib/duitku";

export async function GET(request: NextRequest) {
  console.log("=== TESTING DUITKU INTEGRATION ===");

  try {
    const tests = {
      environment: {
        merchantCode: process.env.DUITKU_MERCHANT_CODE || "Not set",
        apiKey: process.env.DUITKU_API_KEY ? "Set" : "Not set",
        appUrl: process.env.NEXT_PUBLIC_APP_URL || "Not set",
      },
      utilities: {
        orderIdGeneration: DuitkuHelper.generateOrderId("TEST"),
        currencyFormatting: DuitkuHelper.formatCurrency(150000),
        amountValidation: DuitkuHelper.validateAmount(50000),
        paymentMethodName: DuitkuHelper.getPaymentMethodName("BC"),
        callbackUrl: DuitkuHelper.getCallbackUrl(),
        returnUrl: DuitkuHelper.getReturnUrl("test-course"),
      },
      apiConnectivity: null as any,
    };

    // Test Duitku API connectivity
    try {
      console.log("🔌 Testing Duitku API connectivity...");
      const paymentMethods = await DuitkuHelper.getPaymentMethods(50000);
      tests.apiConnectivity = {
        success: true,
        responseCode: paymentMethods.responseCode,
        methodCount: paymentMethods.paymentFee?.length || 0,
        sampleMethod: paymentMethods.paymentFee?.[0]?.paymentName || "None",
      };
      console.log("✅ Duitku API test successful");
    } catch (error) {
      tests.apiConnectivity = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
      console.log("❌ Duitku API test failed:", error);
    }

    return NextResponse.json({
      success: true,
      message: "Duitku integration test completed",
      timestamp: new Date().toISOString(),
      tests,
      recommendations: generateRecommendations(tests),
    });
  } catch (error) {
    console.error("❌ Test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(tests: any): string[] {
  const recommendations = [];

  if (tests.environment.merchantCode === "Not set") {
    recommendations.push("❌ Set DUITKU_MERCHANT_CODE in your .env.local file");
  }

  if (tests.environment.apiKey === "Not set") {
    recommendations.push("❌ Set DUITKU_API_KEY in your .env.local file");
  }

  if (tests.environment.appUrl === "Not set") {
    recommendations.push("❌ Set NEXT_PUBLIC_APP_URL in your .env.local file");
  }

  if (!tests.apiConnectivity?.success) {
    recommendations.push(
      "❌ Duitku API is not accessible - check your credentials and network"
    );
  } else {
    recommendations.push("✅ Duitku API is working correctly");
  }

  if (tests.utilities.amountValidation) {
    recommendations.push("✅ Amount validation is working");
  }

  if (
    recommendations.length === 0 ||
    recommendations.filter((r) => r.startsWith("✅")).length >= 2
  ) {
    recommendations.push(
      "🚀 Integration looks good! Try creating a test payment."
    );
  }

  return recommendations;
}
