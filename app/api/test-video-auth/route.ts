import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  console.log("=== VIDEO AUTH TEST ===");

  try {
    // Test cookie-based authentication (what the video player uses)
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log("Session exists:", !!session);
    console.log("Session error:", sessionError);

    if (sessionError || !session?.user) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        method: "cookie",
        error: "No session found",
        details: sessionError?.message || "No active session",
      });
    }

    // Get user from database
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, name, role")
      .eq("id", session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        method: "cookie",
        error: "User not found in database",
        details: userError?.message || "No user data",
      });
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      method: "cookie",
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
      },
      session: {
        expires_at: session.expires_at,
        access_token: session.access_token ? "present" : "missing",
      },
    });
  } catch (error) {
    console.error("❌ Video auth test error:", error);
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
