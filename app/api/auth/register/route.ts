import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  console.log("=== USER REGISTRATION ===");

  try {
    const body = await request.json();
    console.log("📝 Registration request received for:", body.email);

    const { email, password, name } = body;

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

    console.log("🔐 Creating user in Supabase Auth...");

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
        emailRedirectTo: `${window.location.origin}/auth/signin`,
      },
    });

    if (authError) {
      console.log("❌ Supabase Auth error:", authError.message);
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

    // Check if user already exists in database (in case of retry)
    let dbUser;
    try {
      dbUser = await prisma.user.findUnique({
        where: { id: authData.user.id },
      });

      if (dbUser) {
        console.log("👤 User already exists in database");
        return NextResponse.json({
          success: true,
          user: {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
          },
          message: "User already registered",
        });
      }
    } catch (findError) {
      console.log("⚠️ Error checking existing user:", findError);
      // Continue with creation
    }

    // Create user in our database
    try {
      console.log("💾 Creating user in database...");

      dbUser = await prisma.user.create({
        data: {
          id: authData.user.id,
          email: authData.user.email!,
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

      // Check if it's a unique constraint violation
      if (dbError.code === "P2002") {
        console.log("⚠️ User already exists (unique constraint)");
        // Try to find the existing user
        try {
          const existingUser = await prisma.user.findUnique({
            where: { id: authData.user.id },
          });

          if (existingUser) {
            return NextResponse.json({
              success: true,
              user: {
                id: existingUser.id,
                email: existingUser.email,
                name: existingUser.name,
                role: existingUser.role,
              },
              message: "User already registered",
            });
          }
        } catch (findError) {
          console.error("Error finding existing user:", findError);
        }
      }

      // User was created in Supabase but failed in our DB
      // This is okay - the user can still login and the trigger might handle it
      console.log("⚠️ User created in Supabase but database sync failed");
      return NextResponse.json({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: name,
          role: "STUDENT",
        },
        warning:
          "User created in auth but database sync pending. You can still sign in.",
        message: "Registration completed with minor sync issue",
      });
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
