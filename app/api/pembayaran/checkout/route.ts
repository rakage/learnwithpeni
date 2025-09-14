import { NextRequest, NextResponse } from "next/server";
import { DuitkuHelper } from "@/lib/duitku";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  console.log("=== PEMBAYARAN - CREATE CHECKOUT ===");

  try {
    const body = await request.json();
    const { courseId, paymentMethod, customerInfo } = body;

    // Validate required fields
    if (!courseId || !paymentMethod || !customerInfo) {
      return NextResponse.json(
        { error: "Course ID, payment method, and customer info are required" },
        { status: 400 }
      );
    }

    // Validate customer info
    if (
      !customerInfo.firstName ||
      !customerInfo.email ||
      !customerInfo.phoneNumber
    ) {
      return NextResponse.json(
        { error: "Customer information is incomplete" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if email already exists in database
    const existingUser = await prisma.user.findUnique({
      where: { email: customerInfo.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists. Please use a different email or sign in to make the payment.",
        },
        { status: 409 }
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

    const paymentAmount = Math.round(course.price);

    // Prepare customer information
    const firstName = customerInfo.firstName || "Customer";
    const lastName = customerInfo.lastName || "";
    const customerName = `${firstName} ${lastName}`.trim();
    const phoneNumber = customerInfo.phoneNumber || "081234567890";
    const address = customerInfo.address || "Jl. Sudirman No. 1";
    const city = customerInfo.city || "Jakarta";
    const postalCode = customerInfo.postalCode || "12345";

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
    const merchantOrderId = DuitkuHelper.generateOrderId("PAYF");

    // Prepare transaction data with all required fields
    const transactionData = {
      paymentAmount: paymentAmount,
      paymentMethod: paymentMethod,
      merchantOrderId: merchantOrderId,
      productDetails: `${course.title} - Online Course (Pembayaran)`,
      additionalParam: `courseId=${courseId}&email=${customerInfo.email}&paymentFirst=true`,
      merchantUserInfo: customerInfo.email,
      customerVaName: customerName.substring(0, 20), // Max 20 characters for VA name
      email: customerInfo.email,
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
        email: customerInfo.email,
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
      returnUrl: DuitkuHelper.getPaymentFirstReturnUrl(courseId) + `&merchantOrderId=${merchantOrderId}`,
      callbackUrl: DuitkuHelper.getPaymentFirstCallbackUrl(),
      expiryPeriod: 60, // 60 minutes
    };

    console.log(`💳 Creating pembayaran transaction for course: ${course.title}`);
    console.log(`💰 Amount: ${DuitkuHelper.formatCurrency(paymentAmount)}`);
    console.log(
      `🏦 Payment Method: ${DuitkuHelper.getPaymentMethodName(paymentMethod)}`
    );
    console.log(`🔑 Order ID: ${merchantOrderId}`);
    console.log(`👤 Customer Email: ${customerInfo.email}`);

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

      // Save pending payment record to database
      const pendingPayment = await prisma.pendingPayment.create({
        data: {
          customerEmail: customerInfo.email,
          customerName: `${firstName} ${lastName}`.trim(),
          customerPhone: customerInfo.phoneNumber,
          courseId: courseId,
          stripePaymentId: duitkuResponse.reference,
          merchantOrderId: merchantOrderId,
          amount: paymentAmount,
          currency: "idr",
          status: "PENDING",
        },
      });

      console.log(`💾 Pending payment record saved with ID: ${pendingPayment.id}`);

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
    console.error("❌ Error creating pembayaran checkout:", error);
    return NextResponse.json(
      { error: "Failed to create payment checkout" },
      { status: 500 }
    );
  }
}
