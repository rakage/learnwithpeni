import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("=== AUTH CALLBACK ===");

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  console.log("🔗 Callback URL:", requestUrl.toString());
  console.log("🔑 Auth code present:", !!code);

  if (error) {
    console.error("❌ Auth callback error:", error, errorDescription);
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/signin?error=${encodeURIComponent(error)}`
    );
  }

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });

    try {
      console.log("🔐 Exchanging auth code for session...");
      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("❌ Code exchange error:", exchangeError);
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/signin?error=${encodeURIComponent(
            exchangeError.message
          )}`
        );
      }

      if (data.user) {
        console.log("✅ User authenticated successfully");
        console.log(`👤 User: ${data.user.email} (${data.user.id})`);
        console.log(
          `📧 Email confirmed: ${data.user.email_confirmed_at ? "Yes" : "No"}`
        );

        // Redirect to dashboard after successful authentication
        return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
      }
    } catch (error) {
      console.error("❌ Callback processing error:", error);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/signin?error=${encodeURIComponent(
          "Authentication failed"
        )}`
      );
    }
  }

  // Fallback redirect
  console.log("⚠️ No auth code found, redirecting to sign in");
  return NextResponse.redirect(`${requestUrl.origin}/auth/signin`);
}
