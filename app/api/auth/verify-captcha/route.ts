import { NextRequest, NextResponse } from "next/server";
import { verifyRecaptcha } from "@/lib/recaptcha";

export async function POST(request: NextRequest) {
  console.log("=== RECAPTCHA VERIFICATION API ===");

  try {
    const body = await request.json();
    const { token } = body;

    console.log("🔍 Received token:", token || "Missing");
    console.log("🔍 Token length:", token?.length || 0);
    console.log("🔍 Full request body:", body);

    const result = await verifyRecaptcha(token);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    console.log("✅ reCAPTCHA verification successful via API");
    return NextResponse.json({
      success: true,
      score: result.score,
    });
  } catch (error) {
    console.error("❌ reCAPTCHA API verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify reCAPTCHA" },
      { status: 500 }
    );
  }
}
