import { NextRequest, NextResponse } from "next/server";
import { DuitkuHelper, DUITKU_CONFIG } from "@/lib/duitku";

export async function GET(request: NextRequest) {
  console.log("=== DUITKU INTEGRATION TEST ===");

  try {
    // Test environment variables
    console.log("🔍 Environment Variables:");
    console.log("- NODE_ENV:", process.env.NODE_ENV);
    console.log(
      "- DUITKU_MERCHANT_CODE:",
      process.env.DUITKU_MERCHANT_CODE || "NOT SET"
    );
    console.log(
      "- DUITKU_API_KEY:",
      process.env.DUITKU_API_KEY ? "SET" : "NOT SET"
    );
    console.log(
      "- DUITKU_ENVIRONMENT:",
      process.env.DUITKU_ENVIRONMENT || "NOT SET (defaults to sandbox)"
    );
    console.log(
      "- NEXT_PUBLIC_APP_URL:",
      process.env.NEXT_PUBLIC_APP_URL || "NOT SET"
    );

    console.log("🔍 Duitku Configuration:");
    console.log("- MERCHANT_CODE:", DUITKU_CONFIG.MERCHANT_CODE);
    console.log("- API_KEY:", DUITKU_CONFIG.API_KEY ? "SET" : "NOT SET");
    console.log("- IS_PRODUCTION:", DUITKU_CONFIG.IS_PRODUCTION);
    console.log("- SANDBOX_URL:", DUITKU_CONFIG.SANDBOX_URL);
    console.log("- PRODUCTION_URL:", DUITKU_CONFIG.PRODUCTION_URL);

    // Test utility functions
    console.log("🔧 Testing utility functions...");

    // Test order ID generation
    const orderId = DuitkuHelper.generateOrderId("TEST");
    console.log("✅ Order ID generation:", orderId);

    // Test currency formatting
    const formattedCurrency = DuitkuHelper.formatCurrency(100000);
    console.log("✅ Currency formatting:", formattedCurrency);

    // Test amount validation
    const isValidAmount = DuitkuHelper.validateAmount(100000);
    console.log("✅ Amount validation (100000):", isValidAmount);

    // Test callback/return URLs
    const callbackUrl = DuitkuHelper.getCallbackUrl();
    const returnUrl = DuitkuHelper.getReturnUrl("test-course");
    console.log("✅ Callback URL:", callbackUrl);
    console.log("✅ Return URL:", returnUrl);

    // Test payment methods API call
    console.log("🌐 Testing Duitku API connectivity...");
    const testAmount = 100000;

    try {
      const paymentMethods = await DuitkuHelper.getPaymentMethods(testAmount);
      console.log("✅ Payment methods retrieved successfully");
      console.log("- Response Code:", paymentMethods.responseCode);
      console.log("- Response Message:", paymentMethods.responseMessage);
      console.log("- Methods Count:", paymentMethods.paymentFee?.length || 0);

      return NextResponse.json({
        success: true,
        message: "Duitku integration test completed successfully",
        environment: {
          nodeEnv: process.env.NODE_ENV,
          duitkuEnvironment: process.env.DUITKU_ENVIRONMENT || "sandbox",
          merchantCode: DUITKU_CONFIG.MERCHANT_CODE,
          isProduction: DUITKU_CONFIG.IS_PRODUCTION,
          apiKeySet: !!DUITKU_CONFIG.API_KEY,
        },
        utilities: {
          orderIdGeneration: orderId,
          currencyFormatting: formattedCurrency,
          amountValidation: isValidAmount,
          callbackUrl,
          returnUrl,
        },
        api: {
          connectivity: "SUCCESS",
          responseCode: paymentMethods.responseCode,
          responseMessage: paymentMethods.responseMessage,
          methodsCount: paymentMethods.paymentFee?.length || 0,
        },
      });
    } catch (apiError) {
      console.error("❌ Duitku API connectivity test failed:", apiError);

      return NextResponse.json(
        {
          success: false,
          message: "Duitku integration test failed",
          environment: {
            nodeEnv: process.env.NODE_ENV,
            duitkuEnvironment: process.env.DUITKU_ENVIRONMENT || "sandbox",
            merchantCode: DUITKU_CONFIG.MERCHANT_CODE,
            isProduction: DUITKU_CONFIG.IS_PRODUCTION,
            apiKeySet: !!DUITKU_CONFIG.API_KEY,
          },
          utilities: {
            orderIdGeneration: orderId,
            currencyFormatting: formattedCurrency,
            amountValidation: isValidAmount,
            callbackUrl,
            returnUrl,
          },
          api: {
            connectivity: "FAILED",
            error:
              apiError instanceof Error ? apiError.message : "Unknown error",
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Duitku test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Duitku integration test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
