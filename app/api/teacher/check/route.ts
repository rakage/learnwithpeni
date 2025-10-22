import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";

// Check if user has teacher role
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);

    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isTeacher = authResult.user.role === "TEACHER";

    if (!isTeacher) {
      return NextResponse.json(
        { error: "Access denied. Teacher role required." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: authResult.user,
      isTeacher: true,
    });
  } catch (error) {
    console.error("Teacher check error:", error);
    return NextResponse.json(
      { error: "Failed to verify teacher status" },
      { status: 500 }
    );
  }
}
