import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    console.log("=== AUTH DEBUG ENDPOINT ===");

    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Check cookies
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    console.log(
      "All cookies:",
      allCookies.map((c) => ({
        name: c.name,
        value: c.value?.substring(0, 50) + "...",
      }))
    );

    // Check for Supabase auth cookies specifically
    const authCookies = allCookies.filter((c) => c.name.includes("supabase"));
    console.log("Supabase cookies:", authCookies.length);

    // Try getSession
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    console.log("Session data:", sessionData);
    console.log("Session error:", sessionError);

    // Try getUser
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log("User data:", userData);
    console.log("User error:", userError);

    // Check Authorization header
    const authHeader = request.headers.get("authorization");
    console.log("Authorization header:", authHeader?.substring(0, 50) + "...");

    return NextResponse.json({
      debug: {
        cookieCount: allCookies.length,
        supabaseCookieCount: authCookies.length,
        hasSession: !!sessionData.session,
        hasUser: !!userData.user,
        sessionError: sessionError?.message,
        userError: userError?.message,
        hasAuthHeader: !!authHeader,
        userId: userData.user?.id,
        userEmail: userData.user?.email,
      },
    });
  } catch (error) {
    console.error("Debug auth error:", error);
    return NextResponse.json(
      { error: "Debug failed", details: error },
      { status: 500 }
    );
  }
}
