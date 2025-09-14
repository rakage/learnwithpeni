import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "@/lib/email";

export async function POST(request: NextRequest) {
  console.log("=== TEST EMAIL API ===");

  try {
    const body = await request.json();
    const { email = "test@example.com" } = body;

    const testEmailData = {
      customerName: "John Doe",
      customerEmail: email,
      courseName: "Foundations of Remote Worker",
      coursePrice: 499000,
      paymentReference: "LWP-982734",
      paymentDate: new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
      }).format(new Date()),
      paymentMethod: "BCA Virtual Account",
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      invoiceNumber: `INV-${Date.now()}-TESTTEST`,
    };

    console.log("📧 Testing welcome email...");
    const emailSent = await EmailService.sendWelcomeEmail(testEmailData);

    return NextResponse.json({
      success: emailSent,
      message: emailSent ? "Test welcome email sent successfully" : "Failed to send test email",
      recipient: email,
    });
  } catch (error) {
    console.error("❌ Test email error:", error);
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Test Email API - Use POST to send test welcome emails",
    usage: {
      method: "POST",
      body: {
        email: "recipient@example.com"
      }
    },
    note: "Only sends welcome emails now - registration emails have been removed from the flow"
  });
}
