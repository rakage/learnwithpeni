import { NextRequest, NextResponse } from "next/server";
import { DuitkuHelper, DUITKU_CONFIG } from "@/lib/duitku";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  console.log("=== DUITKU WEBHOOK RECEIVED ===");

  try {
    // Parse form data (Duitku sends x-www-form-urlencoded)
    const formData = await request.formData();

    const callbackData = {
      merchantCode: formData.get("merchantCode") as string,
      amount: formData.get("amount") as string,
      merchantOrderId: formData.get("merchantOrderId") as string,
      productDetails: formData.get("productDetails") as string,
      additionalParam: formData.get("additionalParam") as string,
      paymentCode: formData.get("paymentCode") as string,
      resultCode: formData.get("resultCode") as string,
      merchantUserId: formData.get("merchantUserId") as string,
      reference: formData.get("reference") as string,
      signature: formData.get("signature") as string,
      publisherOrderId: formData.get("publisherOrderId") as string,
      spUserHash: formData.get("spUserHash") as string,
      settlementDate: formData.get("settlementDate") as string,
      issuerCode: formData.get("issuerCode") as string,
    };

    console.log("📨 Callback received:", {
      merchantOrderId: callbackData.merchantOrderId,
      amount: callbackData.amount,
      resultCode: callbackData.resultCode,
      paymentCode: callbackData.paymentCode,
      reference: callbackData.reference,
    });

    // Validate required fields
    if (
      !callbackData.merchantCode ||
      !callbackData.merchantOrderId ||
      !callbackData.signature
    ) {
      console.error("❌ Missing required callback fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate merchant code
    if (callbackData.merchantCode !== DUITKU_CONFIG.MERCHANT_CODE) {
      console.error("❌ Invalid merchant code:", callbackData.merchantCode);
      return NextResponse.json(
        { error: "Invalid merchant code" },
        { status: 400 }
      );
    }

    // Validate signature
    const isValidSignature = DuitkuHelper.validateCallbackSignature(
      callbackData.merchantCode,
      callbackData.amount,
      callbackData.merchantOrderId,
      DUITKU_CONFIG.API_KEY,
      callbackData.signature
    );

    if (!isValidSignature) {
      console.error("❌ Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log("✅ Signature validation passed");

    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentId: callbackData.reference },
      include: {
        user: true,
        course: true,
      },
    });

    if (!payment) {
      console.error("❌ Payment record not found:", callbackData.reference);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    console.log(
      `📋 Payment found for user: ${payment.user.email}, course: ${payment.course.title}`
    );

    // Parse additional parameters to get course and user info
    const additionalParams = new URLSearchParams(
      callbackData.additionalParam || ""
    );
    const courseId = additionalParams.get("courseId");
    const userId = additionalParams.get("userId");

    if (!courseId || !userId) {
      console.error("❌ Missing courseId or userId in additionalParam");
      return NextResponse.json(
        { error: "Invalid additional parameters" },
        { status: 400 }
      );
    }

    // Verify payment belongs to the correct user and course
    if (payment.userId !== userId || payment.courseId !== courseId) {
      console.error("❌ Payment verification failed");
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    // Process based on result code
    if (callbackData.resultCode === "00") {
      // Payment successful
      console.log("💰 Payment successful, processing enrollment...");

      try {
        // Use transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
          // Update payment status
          await tx.payment.update({
            where: { stripePaymentId: callbackData.reference },
            data: {
              status: "COMPLETED",
              stripePaymentId: callbackData.reference,
            },
          });

          // Check if enrollment already exists
          const existingEnrollment = await tx.enrollment.findUnique({
            where: {
              userId_courseId: {
                userId: userId,
                courseId: courseId,
              },
            },
          });

          if (!existingEnrollment) {
            // Create enrollment
            await tx.enrollment.create({
              data: {
                userId: userId,
                courseId: courseId,
              },
            });
            console.log("✅ User enrolled in course successfully");
          } else {
            console.log("ℹ️ User already enrolled in course");
          }
        });

        console.log("✅ Payment and enrollment processed successfully");

        // Log success
        console.log(`🎉 PAYMENT COMPLETED:`);
        console.log(`   - User: ${payment.user.email}`);
        console.log(`   - Course: ${payment.course.title}`);
        console.log(
          `   - Amount: ${DuitkuHelper.formatCurrency(
            parseInt(callbackData.amount)
          )}`
        );
        console.log(`   - Reference: ${callbackData.reference}`);
        console.log(
          `   - Payment Method: ${DuitkuHelper.getPaymentMethodName(
            callbackData.paymentCode
          )}`
        );
      } catch (error) {
        console.error("❌ Error processing successful payment:", error);
        return NextResponse.json(
          { error: "Failed to process enrollment" },
          { status: 500 }
        );
      }
    } else if (callbackData.resultCode === "01") {
      // Payment failed
      console.log("❌ Payment failed");

      await prisma.payment.update({
        where: { stripePaymentId: callbackData.reference },
        data: { status: "FAILED" },
      });

      console.log("💸 Payment marked as failed");
    } else {
      console.log("⚠️ Unknown result code:", callbackData.resultCode);

      // Update payment with unknown status for investigation
      await prisma.payment.update({
        where: { stripePaymentId: callbackData.reference },
        data: {
          status: "PENDING", // Keep as pending for manual review
        },
      });
    }

    // Always return 200 OK to acknowledge receipt
    return NextResponse.json({
      status: "OK",
      message: "Callback processed successfully",
    });
  } catch (error) {
    console.error("❌ Webhook error:", error);

    // Return 200 even on error to prevent Duitku from retrying
    // Log the error for manual investigation
    return NextResponse.json({
      status: "ERROR",
      message: "Webhook processing failed",
    });
  }
}

// Handle GET requests (for testing)
export async function GET(request: NextRequest) {
  console.log("🔍 Duitku webhook endpoint accessed via GET");

  return NextResponse.json({
    message: "Duitku webhook endpoint is active",
    timestamp: new Date().toISOString(),
    url: request.url,
  });
}
