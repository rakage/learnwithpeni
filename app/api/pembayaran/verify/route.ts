import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  console.log("=== VERIFY PEMBAYARAN ===");

  try {
    const body = await request.json();
    const { paymentReference } = body;

    if (!paymentReference) {
      return NextResponse.json(
        { error: "Payment reference is required" },
        { status: 400 }
      );
    }

    // Find pending payment record
    const pendingPayment = await prisma.pendingPayment.findUnique({
      where: { stripePaymentId: paymentReference },
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
      console.log("❌ Pending payment not found:", paymentReference);
      return NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 }
      );
    }

    // Check if payment is completed
    if (pendingPayment.status !== "COMPLETED") {
      console.log("❌ Payment not completed:", pendingPayment.status);
      return NextResponse.json(
        { success: false, error: "Payment not completed" },
        { status: 400 }
      );
    }

    console.log("✅ Payment verified successfully for pembayaran flow");

    return NextResponse.json({
      success: true,
      payment: {
        id: pendingPayment.id,
        reference: pendingPayment.stripePaymentId,
        amount: pendingPayment.amount,
        status: pendingPayment.status,
        customerEmail: pendingPayment.customerEmail,
        customerName: pendingPayment.customerName,
        customerPhone: pendingPayment.customerPhone,
        course: pendingPayment.course,
      },
    });
  } catch (error) {
    console.error("❌ Error verifying payment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
