import { NextRequest, NextResponse } from "next/server";
import { checkUserAuth } from "@/lib/auth-helpers";
import { generateVideoToken } from "@/lib/video-utils";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkUserAuth();
    if (authResult.error) {
      return authResult.error;
    }

    const body = await request.json();
    const { videoPath } = body;

    if (!videoPath) {
      return NextResponse.json(
        {
          success: false,
          error: "Video path is required",
        },
        { status: 400 }
      );
    }

    // Generate a secure token for this user and video
    const token = generateVideoToken(videoPath, authResult.user.id);

    return NextResponse.json({
      success: true,
      token,
      expiresIn: 3600, // 1 hour
    });
  } catch (error) {
    console.error("❌ Video token generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate video token",
      },
      { status: 500 }
    );
  }
}
