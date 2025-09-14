import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  console.log("=== CHECK USER EXISTS ===");

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    console.log(`🔍 Checking if user exists: ${email}`);

    // Check if user exists in our database
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    const userExists = !!existingUser;
    console.log(`${userExists ? '✅' : '❌'} User ${userExists ? 'exists' : 'does not exist'}: ${email}`);

    return NextResponse.json({
      userExists,
      user: existingUser || null,
    });
  } catch (error) {
    console.error("❌ Error checking user existence:", error);
    return NextResponse.json(
      { error: "Failed to check user existence" },
      { status: 500 }
    );
  }
}
