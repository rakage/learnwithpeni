import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  console.log("=== FIND PAYMENT BY MERCHANT ORDER ID ===");

  try {
    const { searchParams } = new URL(request.url);
    const merchantOrderId = searchParams.get("merchantOrderId");

    if (!merchantOrderId) {
      return NextResponse.json(
        { error: "Merchant Order ID is required" },
        { status: 400 }
      );
    }

    console.log(`🔍 Looking for payment with merchant order ID: ${merchantOrderId}`);

    // Find payment by merchant order ID
    const pendingPayment = await prisma.pendingPayment.findUnique({
      where: {
        merchantOrderId: merchantOrderId,
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
      console.log("❌ No payment found with this merchant order ID");
      return NextResponse.json(
        { pendingPayment: null },
        { status: 200 }
      );
    }

    console.log("✅ Found payment by merchant order ID");

    return NextResponse.json({
      pendingPayment: {
        id: pendingPayment.id,
        customerEmail: pendingPayment.customerEmail,
        customerName: pendingPayment.customerName,
        customerPhone: pendingPayment.customerPhone,
        courseId: pendingPayment.courseId,
        stripePaymentId: pendingPayment.stripePaymentId,
        merchantOrderId: pendingPayment.merchantOrderId,
        amount: pendingPayment.amount,
        currency: pendingPayment.currency,
        status: pendingPayment.status,
        course: pendingPayment.course,
        createdAt: pendingPayment.createdAt,
        updatedAt: pendingPayment.updatedAt,
      },
    });
  } catch (error) {
    console.error("❌ Error finding payment by merchant order ID:", error);
    return NextResponse.json(
      { error: "Failed to find payment" },
      { status: 500 }
    );
  }
}
