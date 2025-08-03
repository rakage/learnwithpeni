import { NextRequest, NextResponse } from "next/server";
import S3Helper from "@/lib/aws-s3";
import { checkUserAuth } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  console.log("=== S3 FILE UPLOAD API ===");

  try {
    // Check authentication
    const authResult = await checkUserAuth();
    if (authResult.error) {
      return authResult.error;
    }

    console.log("👤 User authenticated, proceeding with file upload...");

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const courseId = (formData.get("courseId") as string) || undefined;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "No file provided",
        },
        { status: 400 }
      );
    }

    console.log(`📤 Uploading file: ${file.name} (${file.size} bytes)`);

    // Upload to S3
    const result = await S3Helper.uploadCourseFile(file, courseId);

    if (!result.success) {
      console.error("❌ Upload failed:", result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Upload failed",
        },
        { status: 500 }
      );
    }

    console.log("✅ File uploaded successfully:", result.url);

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
      fileName: file.name,
      size: file.size,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("❌ Upload API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
