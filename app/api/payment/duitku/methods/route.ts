import { NextRequest, NextResponse } from "next/server";
import { DuitkuHelper } from "@/lib/duitku";
import { checkUserAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  console.log("=== DUITKU GET PAYMENT METHODS ===");

  try {
    // Check authentication
    const authResult = await checkUserAuth();
    if (authResult.error) {
      return authResult.error;
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const amount = searchParams.get("amount");

    if (!courseId && !amount) {
      return NextResponse.json(
        { error: "Either courseId or amount is required" },
        { status: 400 }
      );
    }

    let paymentAmount: number;

    if (courseId) {
      // Get course price from database
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { price: true, title: true },
      });

      if (!course) {
        return NextResponse.json(
          { error: "Course not found" },
          { status: 404 }
        );
      }

      paymentAmount = Math.round(course.price);
      console.log(
        `💰 Getting payment methods for course: ${course.title}, amount: ${paymentAmount}`
      );
    } else {
      paymentAmount = parseInt(amount!);
      console.log(`💰 Getting payment methods for amount: ${paymentAmount}`);
    }

    // Validate amount
    if (!DuitkuHelper.validateAmount(paymentAmount)) {
      return NextResponse.json(
        {
          error:
            "Invalid payment amount. Must be between IDR 1,000 and IDR 50,000,000",
        },
        { status: 400 }
      );
    }

    // Get payment methods from Duitku
    const paymentMethods = await DuitkuHelper.getPaymentMethods(paymentAmount);

    if (paymentMethods.responseCode !== "00") {
      console.error("❌ Duitku error:", paymentMethods.responseMessage);
      return NextResponse.json(
        { error: "Failed to get payment methods" },
        { status: 500 }
      );
    }

    console.log(
      `✅ Retrieved ${paymentMethods.paymentFee.length} payment methods`
    );

    // Format response with additional information
    const formattedMethods = paymentMethods.paymentFee.map((method) => ({
      ...method,
      displayName: DuitkuHelper.getPaymentMethodName(method.paymentMethod),
      formattedFee:
        method.totalFee === "0"
          ? "Free"
          : DuitkuHelper.formatCurrency(parseInt(method.totalFee)),
    }));

    return NextResponse.json({
      success: true,
      paymentMethods: formattedMethods,
      amount: paymentAmount,
      formattedAmount: DuitkuHelper.formatCurrency(paymentAmount),
      message: "Payment methods retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Error getting payment methods:", error);
    return NextResponse.json(
      { error: "Failed to get payment methods" },
      { status: 500 }
    );
  }
}
