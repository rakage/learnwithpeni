import { NextRequest, NextResponse } from "next/server";
import { DuitkuHelper } from "@/lib/duitku";
import { checkUserAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  console.log("=== DUITKU CREATE CHECKOUT ===");

  try {
    // Check authentication
    const authResult = await checkUserAuth();
    if (authResult.error) {
      return authResult.error;
    }

    const user = authResult.user!;
    const body = await request.json();
    const { courseId, paymentMethod, customerInfo } = body;

    // Validate required fields
    if (!courseId || !paymentMethod) {
      return NextResponse.json(
        { error: "Course ID and payment method are required" },
        { status: 400 }
      );
    }

    // Get course details
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

    // Check if user is already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "You are already enrolled in this course" },
        { status: 400 }
      );
    }
    const taxAmount = Math.round(course.price * 0.01);
    const rakaServiceFee = Math.round(course.price * 0.05);
    const paymentAmount = Math.round(course.price + taxAmount + rakaServiceFee);

    // Prepare customer information
    const firstName =
      customerInfo?.firstName || user.name?.split(" ")[0] || "Customer";
    const lastName =
      customerInfo?.lastName || user.name?.split(" ").slice(1).join(" ") || "";
    const customerName = `${firstName} ${lastName}`.trim();
    const phoneNumber = customerInfo?.phoneNumber || "081234567890";
    const address = customerInfo?.address || "Jl. Sudirman No. 1";
    const city = customerInfo?.city || "Jakarta";
    const postalCode = customerInfo?.postalCode || "12345";

    // Validate required fields
    if (!paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment method is required",
        },
        { status: 400 }
      );
    }

    if (!DuitkuHelper.validateAmount(paymentAmount)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid payment amount: ${paymentAmount}`,
        },
        { status: 400 }
      );
    }

    // Generate unique order ID
    const merchantOrderId = DuitkuHelper.generateOrderId("LMS");

    // Prepare transaction data with all required fields
    const transactionData = {
      paymentAmount: paymentAmount,
      paymentMethod: paymentMethod,
      merchantOrderId: merchantOrderId,
      productDetails: `${course.title} - Online Course`,
      additionalParam: `courseId=${courseId}&userId=${user.id}`,
      merchantUserInfo: user.email,
      customerVaName: customerName.substring(0, 20), // Max 20 characters for VA name
      email: user.email,
      phoneNumber: phoneNumber,
      itemDetails: [
        {
          name: course.title,
          price: paymentAmount,
          quantity: 1,
        },
      ],
      customerDetail: {
        firstName: firstName,
        lastName: lastName,
        email: user.email,
        phoneNumber: phoneNumber,
        billingAddress: {
          firstName: firstName,
          lastName: lastName,
          address: address,
          city: city,
          postalCode: postalCode,
          phone: phoneNumber,
          countryCode: "ID",
        },
        shippingAddress: {
          firstName: firstName,
          lastName: lastName,
          address: address,
          city: city,
          postalCode: postalCode,
          phone: phoneNumber,
          countryCode: "ID",
        },
      },
      returnUrl: DuitkuHelper.getReturnUrl(courseId),
      callbackUrl: DuitkuHelper.getCallbackUrl(),
      expiryPeriod: 60, // 60 minutes
    };

    console.log(`💳 Creating transaction for course: ${course.title}`);
    console.log(`💰 Amount: ${DuitkuHelper.formatCurrency(paymentAmount)}`);
    console.log(
      `🏦 Payment Method: ${DuitkuHelper.getPaymentMethodName(paymentMethod)}`
    );
    console.log(`🔑 Order ID: ${merchantOrderId}`);

    try {
      // Create transaction with Duitku
      const duitkuResponse = await DuitkuHelper.createTransaction(
        transactionData
      );

      if (duitkuResponse.statusCode !== "00") {
        console.error(`❌ Duitku transaction failed:`, duitkuResponse);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create payment transaction",
            details:
              duitkuResponse.statusMessage ||
              "Unknown error from payment provider",
          },
          { status: 400 }
        );
      }

      console.log(
        `✅ Duitku transaction created successfully:`,
        duitkuResponse
      );
      console.log(`📄 Reference: ${duitkuResponse.reference}`);

      // Save payment record to database
      const payment = await prisma.payment.create({
        data: {
          userId: user.id,
          courseId: courseId,
          stripePaymentId: duitkuResponse.reference, // Use Duitku reference as unique identifier
          amount: paymentAmount,
          currency: "idr",
          status: "PENDING",
        },
      });

      console.log(`💾 Payment record saved with ID: ${payment.id}`);

      return NextResponse.json({
        success: true,
        message: "Payment transaction created successfully",
        payment: {
          merchantOrderId: merchantOrderId,
          reference: duitkuResponse.reference,
          amount: paymentAmount,
          formattedAmount: DuitkuHelper.formatCurrency(paymentAmount),
          paymentMethod: paymentMethod,
          paymentMethodName: DuitkuHelper.getPaymentMethodName(paymentMethod),
          paymentUrl: duitkuResponse.paymentUrl,
          vaNumber: duitkuResponse.vaNumber,
          qrString: duitkuResponse.qrString,
          expiryMinutes: 60,
        },
      });
    } catch (duitkuError) {
      console.error(`❌ Duitku API error:`, duitkuError);
      return NextResponse.json(
        {
          success: false,
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
    console.error("❌ Error creating checkout:", error);
    return NextResponse.json(
      { error: "Failed to create payment checkout" },
      { status: 500 }
    );
  }
}
