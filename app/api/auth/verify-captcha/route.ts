import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "reCAPTCHA token is required" },
        { status: 400 }
      );
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      console.error("RECAPTCHA_SECRET_KEY not found in environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Verify the reCAPTCHA token with Google
    const verificationUrl = "https://www.google.com/recaptcha/api/siteverify";
    const verificationData = new URLSearchParams({
      secret: secretKey,
      response: token,
      remoteip: request.ip || "", // Optional: include user's IP
    });

    const verificationResponse = await fetch(verificationUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: verificationData,
    });

    const verificationResult = await verificationResponse.json();

    if (!verificationResult.success) {
      console.log(
        "reCAPTCHA verification failed:",
        verificationResult["error-codes"]
      );
      return NextResponse.json(
        {
          error: "reCAPTCHA verification failed",
          details: verificationResult["error-codes"],
        },
        { status: 400 }
      );
    }

    // Optional: Check score for reCAPTCHA v3 (if using v3)
    if (verificationResult.score !== undefined) {
      const minScore = 0.5; // Adjust threshold as needed
      if (verificationResult.score < minScore) {
        console.log(`reCAPTCHA score too low: ${verificationResult.score}`);
        return NextResponse.json(
          {
            error:
              "reCAPTCHA verification failed - suspicious activity detected",
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      score: verificationResult.score,
    });
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify reCAPTCHA" },
      { status: 500 }
    );
  }
}
