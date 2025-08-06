import { NextRequest, NextResponse } from "next/server";
import { checkUserAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// GET /api/user/profile - Get current user profile
export async function GET(request: NextRequest) {
  console.log("=== GET USER PROFILE ===");

  const { error, user } = await checkUserAuth();
  if (error) return error;

  try {
    console.log("👤 Fetching profile for user:", user.email);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
