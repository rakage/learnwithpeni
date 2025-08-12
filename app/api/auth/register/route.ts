import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { verifyRecaptcha } from "@/lib/recaptcha";

export async function POST(request: NextRequest) {
  console.log("=== USER REGISTRATION ===");

  try {
    const body = await request.json();
    console.log("📝 Registration request received for:", body.email);
    console.log("🔍 Request body keys:", Object.keys(body));
    console.log("🔍 reCAPTCHA token present:", !!body.recaptchaToken);
    console.log("🔍 reCAPTCHA token length:", body.recaptchaToken?.length || 0);

    const { email, password, name, recaptchaToken } = body;

    // Validate required fields
    if (!email || !password || !name) {
      console.log("❌ Missing required fields:", {
        email: !!email,
        password: !!password,
        name: !!name,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate reCAPTCHA token
    if (!recaptchaToken) {
      console.log("❌ Missing reCAPTCHA token");
      return NextResponse.json(
        { error: "reCAPTCHA verification required" },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA token directly
    console.log("🔐 Verifying reCAPTCHA token...");
    const captchaResult = await verifyRecaptcha(recaptchaToken);

    if (!captchaResult.success) {
      console.log("❌ reCAPTCHA verification failed:", captchaResult.error);
      return NextResponse.json(
        { error: captchaResult.error || "reCAPTCHA verification failed" },
        { status: 400 }
      );
    }

    console.log("✅ reCAPTCHA verification successful");

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("❌ Invalid email format:", email);
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      console.log("❌ Password too weak");
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if email already exists in database
    console.log("🔍 Checking if email already exists...");
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        console.log("❌ Email already registered:", email);
        return NextResponse.json(
          {
            error:
              "An account with this email already exists. Please sign in instead.",
          },
          { status: 409 }
        );
      }
    } catch (dbError) {
      console.log("⚠️ Error checking existing email:", dbError);
      // Continue with registration
    }

    console.log("🔐 Creating user in Supabase Auth...");

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/signin`,
      },
    });

    if (authError) {
      console.log("❌ Supabase Auth error:", authError.message);

      // Handle specific Supabase auth errors
      if (authError.message.includes("User already registered")) {
        return NextResponse.json(
          {
            error:
              "An account with this email already exists. Please sign in instead.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      console.log("❌ No user returned from Supabase");
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      );
    }

    console.log("✅ User created in Supabase Auth:", authData.user.id);

    // Check if user was already created by Supabase trigger
    let dbUser;
    try {
      console.log("🔍 Checking if user was created by trigger...");
      dbUser = await prisma.user.findUnique({
        where: { id: authData.user.id },
      });

      if (dbUser) {
        console.log("✅ User already created by Supabase trigger:", dbUser.id);

        // Update the name if it's different (trigger uses email as fallback)
        if (dbUser.name !== name && name) {
          console.log("🔄 Updating user name...");
          dbUser = await prisma.user.update({
            where: { id: authData.user.id },
            data: { name: name },
          });
        }

        return NextResponse.json({
          success: true,
          user: {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
          },
          message: "Registration successful",
        });
      }
    } catch (findError) {
      console.log("⚠️ Error checking for existing user:", findError);
      // Continue with manual creation
    }

    // Create user in our database (fallback if trigger didn't work)
    try {
      console.log("💾 Creating user in database manually...");

      dbUser = await prisma.user.create({
        data: {
          id: authData.user.id,
          email: authData.user.email!.toLowerCase(),
          name: name,
          role: "STUDENT", // Default role
        },
      });

      console.log("✅ User created in database:", dbUser.id);

      return NextResponse.json({
        success: true,
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
        },
        message: "Registration successful",
      });
    } catch (dbError: any) {
      console.error("❌ Database error:", dbError);

      // Check if it's a unique constraint violation on ID (trigger already created user)
      if (dbError.code === "P2002" && dbError.meta?.target?.includes("id")) {
        console.log(
          "🔄 User was created by trigger during our attempt, fetching..."
        );

        try {
          dbUser = await prisma.user.findUnique({
            where: { id: authData.user.id },
          });

          if (dbUser) {
            // Update the name if needed
            if (dbUser.name !== name && name) {
              dbUser = await prisma.user.update({
                where: { id: authData.user.id },
                data: { name: name },
              });
            }

            return NextResponse.json({
              success: true,
              user: {
                id: dbUser.id,
                email: dbUser.email,
                name: dbUser.name,
                role: dbUser.role,
              },
              message: "Registration successful",
            });
          }
        } catch (fetchError) {
          console.error(
            "❌ Failed to fetch user created by trigger:",
            fetchError
          );
        }
      }

      // Check if it's a unique constraint violation on email
      if (dbError.code === "P2002" && dbError.meta?.target?.includes("email")) {
        // Clean up Supabase user if database creation failed due to existing email
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
          console.log("🧹 Cleaned up Supabase user after email conflict");
        } catch (cleanupError) {
          console.error("❌ Failed to cleanup Supabase user:", cleanupError);
        }

        return NextResponse.json(
          {
            error:
              "An account with this email already exists. Please sign in instead.",
          },
          { status: 409 }
        );
      }

      // Other database errors
      return NextResponse.json(
        { error: "Failed to create user account. Please try again." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ Registration error:", error);

    // Handle different types of errors
    if (error.name === "SyntaxError") {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error during registration" },
      { status: 500 }
    );
  }
}
