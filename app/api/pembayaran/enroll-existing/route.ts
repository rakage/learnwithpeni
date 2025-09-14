import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  console.log("=== ENROLL EXISTING USER FROM PEMBAYARAN ===");

  try {
    const body = await request.json();
    const { paymentReference, email, password } = body;

    // Validate required fields
    if (!paymentReference || !email || !password) {
      return NextResponse.json(
        { error: "Payment reference, email, and password are required" },
        { status: 400 }
      );
    }

    console.log(`🔍 Enrolling existing user from pembayaran: ${email}`);

    // Find the pending payment
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
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    if (pendingPayment.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    if (pendingPayment.customerEmail !== email) {
      return NextResponse.json(
        { error: "Email doesn't match payment record" },
        { status: 400 }
      );
    }

    // Verify user credentials
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Find user in our database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User account not found in our system" },
        { status: 404 }
      );
    }

    // Check if user is already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: pendingPayment.courseId,
        },
      },
    });

    if (existingEnrollment) {
      // Clean up pending payment since user is already enrolled
      await prisma.pendingPayment.delete({
        where: { stripePaymentId: paymentReference },
      });

      return NextResponse.json({
        success: true,
        message: "You already have access to this course",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        course: pendingPayment.course,
        alreadyEnrolled: true,
      });
    }

    // Use transaction to create enrollment and payment record
    await prisma.$transaction(async (tx) => {
      // Create proper Payment record
      await tx.payment.create({
        data: {
          userId: user.id,
          courseId: pendingPayment.courseId,
          stripePaymentId: pendingPayment.stripePaymentId,
          amount: pendingPayment.amount,
          currency: pendingPayment.currency,
          status: "COMPLETED",
        },
      });

      // Create enrollment
      await tx.enrollment.create({
        data: {
          userId: user.id,
          courseId: pendingPayment.courseId,
        },
      });

      // Clean up pending payment record
      await tx.pendingPayment.delete({
        where: { stripePaymentId: paymentReference },
      });
    });

    console.log("✅ Existing user enrolled successfully");

    return NextResponse.json({
      success: true,
      message: "Successfully enrolled in course",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      course: pendingPayment.course,
      alreadyEnrolled: false,
    });
  } catch (error) {
    console.error("❌ Error enrolling existing user:", error);
    return NextResponse.json(
      { error: "Failed to complete enrollment" },
      { status: 500 }
    );
  }
}
