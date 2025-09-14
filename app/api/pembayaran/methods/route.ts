import { NextRequest, NextResponse } from "next/server";
import { DuitkuHelper } from "@/lib/duitku";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  console.log("=== PAYMENT FIRST - GET PAYMENT METHODS ===");

  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    // Get course details to validate course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        published: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (!course.published) {
      return NextResponse.json(
        { error: "Course is not available for purchase" },
        { status: 400 }
      );
    }

    const paymentAmount = Math.round(course.price);

    // Validate payment amount
    if (!DuitkuHelper.validateAmount(paymentAmount)) {
      return NextResponse.json(
        { error: `Invalid payment amount: ${paymentAmount}` },
        { status: 400 }
      );
    }

    console.log(`💰 Getting payment methods for course: ${course.title}`);
    console.log(`💵 Amount: ${DuitkuHelper.formatCurrency(paymentAmount)}`);

    try {
      // Get available payment methods from Duitku
      const duitkuResponse = await DuitkuHelper.getPaymentMethods(paymentAmount);

      console.log(`🔍 Duitku response structure:`, {
        responseCode: duitkuResponse?.responseCode,
        paymentFeeCount: duitkuResponse?.paymentFee?.length,
        hasPaymentFee: !!duitkuResponse?.paymentFee
      });

      if (!duitkuResponse || duitkuResponse.responseCode !== "00" || !duitkuResponse.paymentFee) {
        console.log("⚠️ No payment methods returned from Duitku", {
          responseCode: duitkuResponse?.responseCode,
          hasPaymentFee: !!duitkuResponse?.paymentFee
        });
        return NextResponse.json(
          { error: "No payment methods available" },
          { status: 400 }
        );
      }

      const paymentMethods = duitkuResponse.paymentFee;

      if (!paymentMethods || paymentMethods.length === 0) {
        console.log("⚠️ No payment methods in response");
        return NextResponse.json(
          { error: "No payment methods available" },
          { status: 400 }
        );
      }

      console.log(`✅ Retrieved ${paymentMethods.length} payment methods`);

      return NextResponse.json({
        success: true,
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          price: course.price,
        },
        paymentMethods: paymentMethods.map((method) => ({
          ...method,
          formattedFee: DuitkuHelper.formatCurrency(
            parseInt(method.totalFee) || 0
          ),
          displayName: DuitkuHelper.getPaymentMethodName(method.paymentMethod),
        })),
        amount: paymentAmount,
        formattedAmount: DuitkuHelper.formatCurrency(paymentAmount),
      });
    } catch (duitkuError) {
      console.error("❌ Duitku API error:", duitkuError);
      return NextResponse.json(
        {
          error: "Payment service error",
          details:
            duitkuError instanceof Error
              ? duitkuError.message
              : "Unknown payment service error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Error fetching payment methods:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment methods" },
      { status: 500 }
    );
  }
}
