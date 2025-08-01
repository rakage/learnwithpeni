import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth-helpers";

// GET /api/admin/check - Check if user has admin privileges
export async function GET(request: NextRequest) {
  try {
    const { error, user } = await checkAdminAuth();
    if (error) return error;
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json(
      { error: "Failed to check admin status" },
      { status: 500 }
    );
  }
}
