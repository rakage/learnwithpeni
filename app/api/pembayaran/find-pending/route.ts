import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  console.log("=== FIND PENDING PAYMENT ===");

  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    console.log(`🔍 Looking for pending payment for course: ${courseId}`);

    // Find the most recent completed pending payment for this course
    // This is a fallback when localStorage is missing
    const pendingPayment = await prisma.pendingPayment.findFirst({
      where: {
        courseId: courseId,
        status: "COMPLETED",
      },
      orderBy: {
        updatedAt: "desc", // Get the most recent one
      },
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
      console.log("❌ No pending payment found for course");
      return NextResponse.json(
        { pendingPayment: null },
        { status: 200 }
      );
    }

    // Check if this payment was made recently (within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (pendingPayment.updatedAt < oneHourAgo) {
      console.log("❌ Pending payment is too old");
      return NextResponse.json(
        { pendingPayment: null },
        { status: 200 }
      );
    }

    console.log("✅ Found recent pending payment");

    return NextResponse.json({
      pendingPayment: {
        id: pendingPayment.id,
        customerEmail: pendingPayment.customerEmail,
        customerName: pendingPayment.customerName,
        customerPhone: pendingPayment.customerPhone,
        courseId: pendingPayment.courseId,
        stripePaymentId: pendingPayment.stripePaymentId,
        amount: pendingPayment.amount,
        currency: pendingPayment.currency,
        status: pendingPayment.status,
        course: pendingPayment.course,
        createdAt: pendingPayment.createdAt,
        updatedAt: pendingPayment.updatedAt,
      },
    });
  } catch (error) {
    console.error("❌ Error finding pending payment:", error);
    return NextResponse.json(
      { error: "Failed to find pending payment" },
      { status: 500 }
    );
  }
}
