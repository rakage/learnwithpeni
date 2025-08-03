import { NextRequest, NextResponse } from "next/server";
import { checkUserAuth } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  console.log("=== TESTING BEARER TOKEN AUTHENTICATION ===");

  try {
    // Get the Authorization header
    const authHeader = request.headers.get("Authorization");
    console.log("🔍 Authorization header:", authHeader ? "Present" : "Missing");

    if (authHeader) {
      console.log(
        "🔍 Auth header format:",
        authHeader.startsWith("Bearer ") ? "Correct" : "Incorrect"
      );
    }

    // Check authentication using our helper
    const authResult = await checkUserAuth();

    if (authResult.error) {
      console.log("❌ Authentication failed");
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          error: "Authentication failed",
          details: "User not authenticated",
        },
        { status: 401 }
      );
    }

    console.log("✅ Authentication successful");
    console.log(
      "👤 User:",
      authResult.user.email,
      "Role:",
      authResult.user.role
    );

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.name,
        role: authResult.user.role,
      },
      message: "Bearer token authentication working correctly",
    });
  } catch (error) {
    console.error("❌ Auth test error:", error);
    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
