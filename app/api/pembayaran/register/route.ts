import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { EmailService } from "@/lib/email";
import { DuitkuHelper } from "@/lib/duitku";

export async function POST(request: NextRequest) {
  console.log("=== PEMBAYARAN - COMPLETE REGISTRATION ===");

  try {
    const body = await request.json();
    const { paymentReference, customerInfo, courseId } = body;

    // Validate required fields
    if (!paymentReference || !customerInfo || !courseId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password } = customerInfo;

    if (!firstName || !email || !password) {
      return NextResponse.json(
        { error: "Customer information is incomplete" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    console.log(`🔍 Processing registration for pembayaran: ${email}`);

    // Find and verify the pending payment
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
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    if (pendingPayment.status !== "COMPLETED") {
      console.log("❌ Payment not completed:", pendingPayment.status);
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    if (pendingPayment.courseId !== courseId) {
      console.log("❌ Course ID mismatch");
      return NextResponse.json(
        { error: "Course ID mismatch" },
        { status: 400 }
      );
    }

    // Check if email matches the one stored in pending payment
    if (pendingPayment.customerEmail !== email) {
      console.log("❌ Email mismatch");
      return NextResponse.json(
        { error: "Email doesn't match payment record" },
        { status: 400 }
      );
    }

    // Check if user already exists in our database
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      console.log("❌ User already exists:", email);
      
      // Check if this user already has an enrollment for this course
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: existingUser.id,
            courseId: courseId,
          },
        },
      });
      
      if (existingEnrollment) {
        return NextResponse.json(
          {
            error: "You already have access to this course. Please sign in to continue.",
          },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        {
          error: "An account with this email already exists. Please sign in instead.",
        },
        { status: 409 }
      );
    }

    console.log("🔐 Creating user in Supabase Auth...");

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: `${firstName} ${lastName}`.trim(),
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      },
    });

    if (authError) {
      console.log("❌ Supabase Auth error:", authError.message);
      
      // Handle specific error for existing user
      if (authError.message.includes("User already registered") || authError.message.includes("already been registered")) {
        return NextResponse.json(
          {
            error: "An account with this email already exists. Please sign in instead.",
          },
          { status: 409 }
        );
      }
      
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      console.log("❌ No user returned from Supabase");
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      );
    }

    console.log("✅ User created in Supabase Auth:", authData.user.id);

    try {
      // Use transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // Check if user already exists in database
        let dbUser = await tx.user.findUnique({
          where: { id: authData.user!.id },
        });

        if (!dbUser) {
          // Create user in our database
          dbUser = await tx.user.create({
            data: {
              id: authData.user!.id,
              email: email.toLowerCase(),
              name: `${firstName} ${lastName}`.trim(),
              role: "STUDENT",
            },
          });
          console.log("✅ User created in database:", dbUser.id);
        } else {
          console.log("✅ User already exists in database:", dbUser.id);
          // Update name if different
          if (dbUser.name !== `${firstName} ${lastName}`.trim()) {
            dbUser = await tx.user.update({
              where: { id: authData.user!.id },
              data: { name: `${firstName} ${lastName}`.trim() },
            });
            console.log("✅ User name updated in database");
          }
        }

        // Create proper Payment record from PendingPayment
        await tx.payment.create({
          data: {
            userId: authData.user!.id,
            courseId: pendingPayment.courseId,
            stripePaymentId: pendingPayment.stripePaymentId,
            amount: pendingPayment.amount,
            currency: pendingPayment.currency,
            status: "COMPLETED",
          },
        });

        console.log("✅ Payment record created for user");

        // Create enrollment
        await tx.enrollment.create({
          data: {
            userId: authData.user!.id,
            courseId: courseId,
          },
        });

        console.log("✅ User enrolled in course");

        // Clean up pending payment record
        await tx.pendingPayment.delete({
          where: { stripePaymentId: paymentReference },
        });

        console.log("✅ Pending payment record cleaned up");
      });

      console.log("🎉 PAYMENT FIRST REGISTRATION COMPLETED:");
      console.log(`   - User: ${email}`);
      console.log(`   - Course: ${pendingPayment.course.title}`);
      console.log(`   - User ID: ${authData.user!.id}`);

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}-${authData.user!.id.slice(0, 8).toUpperCase()}`;
      
      // Email was already sent after payment confirmation
      // No need to send another email after registration completion
      console.log('✅ Registration completed - email was already sent after payment confirmation');

      return NextResponse.json({
        success: true,
        message: "Registration completed successfully",
        user: {
          id: authData.user!.id,
          email: email,
          name: `${firstName} ${lastName}`.trim(),
          role: "STUDENT",
        },
        course: pendingPayment.course,
        invoiceNumber: invoiceNumber,
      });
    } catch (dbError: any) {
      console.error("❌ Database error:", dbError);

      // Don't clean up Supabase user for unique constraint errors as user might already exist
      if (dbError.code !== "P2002") {
        // Clean up Supabase user if database creation failed for other reasons
        try {
          await supabase.auth.admin.deleteUser(authData.user!.id);
          console.log("🧧 Cleaned up Supabase user after database error");
        } catch (cleanupError) {
          console.error("❌ Failed to cleanup Supabase user:", cleanupError);
        }
      }

      if (dbError.code === "P2002") {
        // Unique constraint violation - user likely already exists
        if (dbError.meta?.target?.includes("email")) {
          return NextResponse.json(
            {
              error: "An account with this email already exists. Please sign in instead.",
            },
            { status: 409 }
          );
        } else if (dbError.meta?.target?.includes("id")) {
          return NextResponse.json(
            {
              error: "Registration is already in progress for this payment. Please try signing in instead.",
            },
            { status: 409 }
          );
        }
      }

      return NextResponse.json(
        { error: "Failed to complete registration. Please try again." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ Registration completion error:", error);
    return NextResponse.json(
      { error: "Internal server error during registration" },
      { status: 500 }
    );
  }
}
