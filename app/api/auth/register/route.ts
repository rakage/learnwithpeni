import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  console.log("=== USER REGISTRATION ===");

  try {
    const { email, password, name } = await request.json();
    console.log(`📧 Registration attempt for: ${email}`);

    // Input validation
    if (!email || !password || !name) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("❌ Invalid email format");
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      console.log("❌ Password too short");
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get the correct redirect URL based on environment
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUrl = `${baseUrl}/auth/callback`;

    console.log(`🔗 Using redirect URL: ${redirectUrl}`);

    // Create user in Supabase Auth
    console.log("🔐 Creating user in Supabase Auth...");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error("❌ Supabase signup error:", error);

      // Check for existing user
      if (error.message?.includes("User already registered")) {
        return NextResponse.json(
          {
            error:
              "An account with this email already exists. Please sign in instead.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("✅ Supabase user created successfully");
    console.log(`👤 User ID: ${data.user?.id}`);
    console.log(`📧 Email: ${data.user?.email}`);
    console.log(`✉️ Confirmation sent: ${!data.user?.email_confirmed_at}`);

    // Check if user profile was created by trigger
    if (data.user?.id) {
      try {
        console.log("🔍 Checking if user profile exists in database...");
        const existingUser = await prisma.user.findUnique({
          where: { id: data.user.id },
        });

        if (existingUser) {
          console.log("✅ User profile found in database");
        } else {
          console.log("⚠️ User profile not found, trigger may not have fired");
          // The trigger should handle this, but we can log for debugging
        }
      } catch (dbError) {
        console.error("⚠️ Database check error:", dbError);
        // Don't fail the registration, just log the issue
      }
    }

    return NextResponse.json({
      message:
        "User registered successfully. Please check your email to confirm your account.",
      user: {
        id: data.user?.id,
        email: data.user?.email,
        emailConfirmed: !!data.user?.email_confirmed_at,
      },
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error during registration" },
      { status: 500 }
    );
  }
}
