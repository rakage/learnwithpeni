import { NextRequest, NextResponse } from "next/server";
import { DuitkuHelper, DUITKU_CONFIG } from "@/lib/duitku";
import { prisma } from "@/lib/prisma";
import { EmailService } from "@/lib/email";

export async function POST(request: NextRequest) {
  console.log("=== DUITKU PEMBAYARAN WEBHOOK RECEIVED ===");
  console.log("🔵 This is the PEMBAYARAN webhook!");

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

    console.log("📨 Pembayaran Callback received:", {
      merchantOrderId: callbackData.merchantOrderId,
      amount: callbackData.amount,
      resultCode: callbackData.resultCode,
      paymentCode: callbackData.paymentCode,
      reference: callbackData.reference,
      additionalParam: callbackData.additionalParam,
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

    // Find pending payment record
    const pendingPayment = await prisma.pendingPayment.findUnique({
      where: { stripePaymentId: callbackData.reference },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
          },
        },
      },
    });

    if (!pendingPayment) {
      console.error("❌ Pending payment record not found:", callbackData.reference);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    console.log(`📋 Pending payment found for pembayaran flow: ${pendingPayment.id}`);

    // Parse additional parameters to validate
    const additionalParams = new URLSearchParams(
      callbackData.additionalParam || ""
    );
    const courseId = additionalParams.get("courseId");
    const email = additionalParams.get("email");
    const isPaymentFirst = additionalParams.get("paymentFirst") === "true";

    if (!courseId || !email || !isPaymentFirst) {
      console.error("❌ Missing required parameters in additionalParam");
      return NextResponse.json(
        { error: "Invalid additional parameters" },
        { status: 400 }
      );
    }

    // Validate that the pending payment matches the callback data
    if (pendingPayment.courseId !== courseId || pendingPayment.customerEmail !== email) {
      console.error("❌ Pending payment data mismatch");
      return NextResponse.json(
        { error: "Payment data mismatch" },
        { status: 400 }
      );
    }

    // Process based on result code
    if (callbackData.resultCode === "00") {
      // Payment successful
      console.log("💰 Pembayaran flow successful, updating payment status...");

      try {
        // Update pending payment status
        await prisma.pendingPayment.update({
          where: { stripePaymentId: callbackData.reference },
          data: {
            status: "COMPLETED",
          },
        });

        console.log("✅ Pembayaran status updated successfully");

        // Log success
        console.log(`🎉 PEMBAYARAN COMPLETED:`);
        console.log(`   - Email: ${pendingPayment.customerEmail}`);
        console.log(`   - Course: ${pendingPayment.course.title}`);
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
        console.log(
          `   - Next Step: User will be redirected to complete registration`
        );

        // Send payment confirmation email
        try {
          const emailData = {
            customerName: pendingPayment.customerName,
            customerEmail: pendingPayment.customerEmail,
            courseName: pendingPayment.course.title,
            coursePrice: pendingPayment.amount,
            paymentReference: callbackData.reference,
            paymentDate: new Intl.DateTimeFormat('id-ID', {
              year: 'numeric',
              month: 'long',
              day: 'numeric', 
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Jakarta'
            }).format(new Date()),
            paymentMethod: DuitkuHelper.getPaymentMethodName(callbackData.paymentCode),
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pembayaran/success?ref=${callbackData.reference}&courseId=${pendingPayment.courseId}`,
            invoiceNumber: `TEMP-${callbackData.reference.slice(-8)}`,
          };
          
          const emailSent = await EmailService.sendWelcomeEmail(emailData);
          console.log(emailSent ? '✅ Welcome email sent successfully' : '⚠️ Welcome email failed');
        } catch (emailError) {
          console.error('❌ Failed to send welcome email:', emailError);
          // Don't fail the webhook if email fails
        }
      } catch (error) {
        console.error("❌ Error processing successful pembayaran:", error);
        return NextResponse.json(
          { error: "Failed to update payment status" },
          { status: 500 }
        );
      }
    } else if (callbackData.resultCode === "01") {
      // Payment failed
      console.log("❌ Pembayaran failed");

      await prisma.pendingPayment.update({
        where: { stripePaymentId: callbackData.reference },
        data: { status: "FAILED" },
      });

      console.log("💸 Payment First marked as failed");
    } else {
      console.log("⚠️ Unknown result code:", callbackData.resultCode);

      // Update payment with unknown status for investigation
      await prisma.pendingPayment.update({
        where: { stripePaymentId: callbackData.reference },
        data: {
          status: "PENDING", // Keep as pending for manual review
        },
      });
    }

    // Always return 200 OK to acknowledge receipt
    return NextResponse.json({
      status: "OK",
      message: "Payment First callback processed successfully",
    });
  } catch (error) {
    console.error("❌ Payment First Webhook error:", error);

    // Return 200 even on error to prevent Duitku from retrying
    // Log the error for manual investigation
    return NextResponse.json({
      status: "ERROR",
      message: "Payment First webhook processing failed",
    });
  }
}

// Handle GET requests (for testing)
export async function GET(request: NextRequest) {
  console.log("🔍 Duitku Payment First webhook endpoint accessed via GET");

  return NextResponse.json({
    message: "Duitku Payment First webhook endpoint is active",
    timestamp: new Date().toISOString(),
    url: request.url,
  });
}
