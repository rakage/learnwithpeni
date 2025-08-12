export async function verifyRecaptcha(
  token: string
): Promise<{ success: boolean; error?: string; score?: number }> {
  try {
    if (!token) {
      return { success: false, error: "reCAPTCHA token is required" };
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      console.error("RECAPTCHA_SECRET_KEY not found in environment variables");
      return { success: false, error: "Server configuration error" };
    }

    // Verify the reCAPTCHA token with Google
    const verificationUrl = "https://www.google.com/recaptcha/api/siteverify";
    const verificationData = new URLSearchParams({
      secret: secretKey,
      response: token,
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
        "❌ reCAPTCHA verification failed:",
        verificationResult["error-codes"]
      );
      return {
        success: false,
        error: "reCAPTCHA verification failed",
      };
    }

    // Optional: Check score for reCAPTCHA v3 (if using v3)
    if (verificationResult.score !== undefined) {
      const minScore = 0.5; // Adjust threshold as needed
      if (verificationResult.score < minScore) {
        console.log(`reCAPTCHA score too low: ${verificationResult.score}`);
        return {
          success: false,
          error: "reCAPTCHA verification failed - suspicious activity detected",
        };
      }
    }

    return {
      success: true,
      score: verificationResult.score,
    };
  } catch (error) {
    console.error("❌ reCAPTCHA verification error:", error);
    return { success: false, error: "Failed to verify reCAPTCHA" };
  }
}
