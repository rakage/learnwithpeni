import { NextRequest, NextResponse } from "next/server";
import { DuitkuHelper } from "@/lib/duitku";
import { checkUserAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  console.log("=== DUITKU CHECK STATUS ===");

  try {
    // Check authentication
    const authResult = await checkUserAuth();
    if (authResult.error) {
      return authResult.error;
    }

    const user = authResult.user!;
    const { searchParams } = new URL(request.url);
    const merchantOrderId = searchParams.get("merchantOrderId");

    if (!merchantOrderId) {
      return NextResponse.json(
        { error: "Merchant Order ID is required" },
        { status: 400 }
      );
    }

    // Find payment record and verify ownership
    const payment = await prisma.payment.findUnique({
      where: { id: merchantOrderId },
      include: {
        user: true,
        course: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Verify the payment belongs to the authenticated user
    if (payment.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized access to payment" },
        { status: 403 }
      );
    }

    console.log(`🔍 Checking status for order: ${merchantOrderId}`);

    try {
      // Check status with Duitku
      const statusResponse = await DuitkuHelper.checkTransactionStatus(
        merchantOrderId
      );

      console.log("📊 Duitku status response:", {
        merchantOrderId: statusResponse.merchantOrderId,
        statusCode: statusResponse.statusCode,
        statusMessage: statusResponse.statusMessage,
        amount: statusResponse.amount,
      });

      // Map Duitku status codes to our payment statuses
      let paymentStatus = payment.status;
      let enrollmentStatus = false;

      // Check enrollment status
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: payment.courseId,
          },
        },
      });

      enrollmentStatus = !!enrollment;

      // Update local payment status based on Duitku response
      if (
        statusResponse.statusCode === "00" &&
        payment.status !== "COMPLETED"
      ) {
        // Payment completed - update our records
        await prisma.payment.update({
          where: { id: merchantOrderId },
          data: { status: "COMPLETED" },
        });
        paymentStatus = "COMPLETED";

        // If not enrolled yet, create enrollment
        if (!enrollmentStatus) {
          await prisma.enrollment.create({
            data: {
              userId: user.id,
              courseId: payment.courseId,
            },
          });
          enrollmentStatus = true;
          console.log("✅ User enrolled after status check");
        }
      } else if (
        statusResponse.statusCode === "02" &&
        payment.status !== "FAILED"
      ) {
        // Payment cancelled/failed
        await prisma.payment.update({
          where: { id: merchantOrderId },
          data: { status: "FAILED" },
        });
        paymentStatus = "FAILED";
      }

      // Prepare detailed response
      const response = {
        success: true,
        payment: {
          merchantOrderId: payment.id,
          reference: statusResponse.reference,
          amount: parseInt(statusResponse.amount),
          formattedAmount: DuitkuHelper.formatCurrency(
            parseInt(statusResponse.amount)
          ),
          fee: parseFloat(statusResponse.fee),
          formattedFee: DuitkuHelper.formatCurrency(
            parseFloat(statusResponse.fee)
          ),
          status: paymentStatus,
          duitkuStatus: statusResponse.statusCode,
          duitkuMessage: statusResponse.statusMessage,
          isCompleted: paymentStatus === "COMPLETED",
          isPending: paymentStatus === "PENDING",
          isFailed: paymentStatus === "FAILED",
          createdAt: payment.createdAt,
        },
        course: {
          id: payment.course.id,
          title: payment.course.title,
          description: payment.course.description,
        },
        enrollment: {
          isEnrolled: enrollmentStatus,
          hasAccess: enrollmentStatus || paymentStatus === "COMPLETED",
        },
        actions: {
          canRetry: paymentStatus === "FAILED",
          canAccess: enrollmentStatus,
          needsPayment: !enrollmentStatus && paymentStatus !== "COMPLETED",
        },
      };

      return NextResponse.json(response);
    } catch (duitkuError) {
      console.error("❌ Duitku API error:", duitkuError);

      // Return local payment information even if Duitku API fails
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: payment.courseId,
          },
        },
      });

      return NextResponse.json({
        success: true,
        payment: {
          merchantOrderId: payment.id,
          reference: payment.stripePaymentId,
          amount: payment.amount,
          formattedAmount: DuitkuHelper.formatCurrency(payment.amount),
          status: payment.status,
          isCompleted: payment.status === "COMPLETED",
          isPending: payment.status === "PENDING",
          isFailed: payment.status === "FAILED",
          createdAt: payment.createdAt,
        },
        course: {
          id: payment.course.id,
          title: payment.course.title,
          description: payment.course.description,
        },
        enrollment: {
          isEnrolled: !!enrollment,
          hasAccess: !!enrollment || payment.status === "COMPLETED",
        },
        warning:
          "Status retrieved from local database. Duitku API temporarily unavailable.",
      });
    }
  } catch (error) {
    console.error("❌ Error checking payment status:", error);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }
}
