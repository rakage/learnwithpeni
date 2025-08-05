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

    // Check content type
    const contentType = request.headers.get("content-type") || "";
    let body;

    // Handle different content types
    if (contentType.includes("application/json")) {
      // Parse request body as JSON
      try {
        body = await request.json();
      } catch (e) {
        console.error("❌ Failed to parse JSON:", e);
        return NextResponse.json(
          {
            success: false,
            error: "Invalid JSON format",
            details: e instanceof Error ? e.message : "Unknown JSON parsing error",
          },
          { status: 400 }
        );
      }
    } else if (contentType.includes("multipart/form-data")) {
      // Handle form data for backward compatibility
      try {
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
        
        // Upload directly using the old method
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
      } catch (formError) {
        console.error("❌ Failed to parse form data:", formError);
        return NextResponse.json(
          {
            success: false,
            error: "Invalid form data",
            details: formError instanceof Error ? formError.message : "Unknown form data error",
          },
          { status: 400 }
        );
      }
    } else {
      // For other content types, try to parse as JSON first
      try {
        body = await request.json();
      } catch (jsonError) {
        // If JSON parsing fails, try to get form data
        try {
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
          
          // Upload directly using the old method
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
        } catch (formError) {
          console.error("❌ Failed to parse request body:", formError);
          return NextResponse.json(
            {
              success: false,
              error: "Invalid request format",
              details: "Request must be either JSON or FormData",
            },
            { status: 400 }
          );
        }
      }
    }

    // Process JSON request for presigned URL
    const { fileName, fileType, fileSize, courseId } = body;

    if (!fileName || !fileType) {
      return NextResponse.json(
        {
          success: false,
          error: "File name and type are required",
        },
        { status: 400 }
      );
    }

    console.log(`📤 Preparing upload for file: ${fileName} (${fileSize} bytes)`);

    // Generate a unique file path for S3
    const category = S3Helper.getFileCategory(fileType);
    const filePath = S3Helper.generateFilePath(category, fileName, courseId);

    // Generate a pre-signed URL for direct upload
    const presignedUrl = await S3Helper.generatePresignedUploadUrl(filePath, fileType);

    console.log("✅ Presigned URL generated successfully");

    return NextResponse.json({
      success: true,
      presignedUrl,
      url: S3Helper.getPublicUrl(filePath),
      key: filePath,
      fileName,
      size: fileSize,
      message: "Presigned URL generated successfully",
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

// Handle upload confirmation
export async function PUT(request: NextRequest) {
  console.log("=== S3 UPLOAD CONFIRMATION API ===");

  try {
    // Check authentication
    const authResult = await checkUserAuth();
    if (authResult.error) {
      return authResult.error;
    }

    console.log("👤 User authenticated, proceeding with upload confirmation...");

    // Check content type and parse request body
    const contentType = request.headers.get("content-type") || "";
    let body;

    if (contentType.includes("application/json")) {
      try {
        body = await request.json();
      } catch (e) {
        console.error("❌ Failed to parse JSON:", e);
        return NextResponse.json(
          {
            success: false,
            error: "Invalid JSON format",
            details: e instanceof Error ? e.message : "Unknown JSON parsing error",
          },
          { status: 400 }
        );
      }
    } else {
      // Fallback to form data if not JSON
      try {
        const formData = await request.formData();
        body = Object.fromEntries(formData.entries());
      } catch (formError) {
        console.error("❌ Failed to parse request body:", formError);
        return NextResponse.json(
          {
            success: false,
            error: "Invalid request format",
            details: "Request must be either JSON or FormData",
          },
          { status: 400 }
        );
      }
    }

    // Validate required fields
    const { key, fileName, size } = body;

    if (!key) {
      return NextResponse.json(
        {
          success: false,
          error: "File key is required",
        },
        { status: 400 }
      );
    }

    console.log(`✅ Confirming upload for file: ${fileName || key}`);

    // Return confirmation with public URL
    return NextResponse.json({
      success: true,
      url: S3Helper.getPublicUrl(key),
      key,
      fileName: fileName || key.split("/").pop(),
      size: size || 0,
      message: "Upload confirmed successfully",
    });
  } catch (error) {
    console.error("❌ Upload confirmation API error:", error);
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
