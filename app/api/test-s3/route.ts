import { NextRequest, NextResponse } from "next/server";
import S3Helper, { AWS_CONFIG } from "@/lib/aws-s3";

export async function GET(request: NextRequest) {
  console.log("=== AWS S3 INTEGRATION TEST ===");

  try {
    // Test environment variables
    console.log("🔍 Environment Variables:");
    console.log("- AWS_REGION:", process.env.AWS_REGION || "NOT SET");
    console.log(
      "- AWS_ACCESS_KEY_ID:",
      process.env.AWS_ACCESS_KEY_ID ? "SET" : "NOT SET"
    );
    console.log(
      "- AWS_SECRET_ACCESS_KEY:",
      process.env.AWS_SECRET_ACCESS_KEY ? "SET" : "NOT SET"
    );
    console.log(
      "- AWS_S3_BUCKET_NAME:",
      process.env.AWS_S3_BUCKET_NAME || "NOT SET"
    );

    console.log("🔍 AWS Configuration:");
    console.log("- Region:", AWS_CONFIG.region);
    console.log("- Access Key:", AWS_CONFIG.accessKeyId ? "SET" : "NOT SET");
    console.log(
      "- Secret Key:",
      AWS_CONFIG.secretAccessKey ? "SET" : "NOT SET"
    );
    console.log("- Bucket Name:", AWS_CONFIG.bucketName);

    // Validate configuration
    const configValidation = S3Helper.validateConfig();
    console.log("🔧 Configuration Validation:");
    console.log("- Valid:", configValidation.valid);
    if (!configValidation.valid) {
      console.log("- Missing variables:", configValidation.missing);
    }

    // Test S3 connection
    console.log("🌐 Testing S3 connectivity...");
    const connectionTest = await S3Helper.testConnection();
    console.log("- Connection successful:", connectionTest.success);
    if (!connectionTest.success) {
      console.log("- Connection error:", connectionTest.error);
    }

    // Test file path generation
    console.log("🔧 Testing utility functions...");
    const testFilePath = S3Helper.generateFilePath(
      "videos",
      "test-video.mp4",
      "course-123"
    );
    const testPublicUrl = S3Helper.getPublicUrl(testFilePath);
    console.log("- Generated file path:", testFilePath);
    console.log("- Generated public URL:", testPublicUrl);

    return NextResponse.json({
      success: true,
      message: "AWS S3 integration test completed",
      environment: {
        region: AWS_CONFIG.region,
        bucketName: AWS_CONFIG.bucketName,
        accessKeySet: !!AWS_CONFIG.accessKeyId,
        secretKeySet: !!AWS_CONFIG.secretAccessKey,
      },
      validation: configValidation,
      connectivity: connectionTest,
      utilities: {
        sampleFilePath: testFilePath,
        samplePublicUrl: testPublicUrl,
      },
      recommendations: generateRecommendations(
        configValidation,
        connectionTest
      ),
    });
  } catch (error) {
    console.error("❌ S3 test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "AWS S3 integration test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(
  configValidation: { valid: boolean; missing: string[] },
  connectionTest: { success: boolean; error?: string }
): string[] {
  const recommendations = [];

  if (!configValidation.valid) {
    recommendations.push(
      `❌ Missing environment variables: ${configValidation.missing.join(", ")}`
    );
    recommendations.push("📋 Add missing variables to your .env.local file");
  }

  if (!connectionTest.success) {
    recommendations.push(
      "❌ S3 connection failed - check your credentials and bucket access"
    );
    if (connectionTest.error?.includes("AccessDenied")) {
      recommendations.push(
        "🔐 Check your AWS IAM permissions - user needs S3 read/write access"
      );
    }
    if (connectionTest.error?.includes("NoSuchBucket")) {
      recommendations.push(
        "🪣 Check your bucket name - bucket may not exist or be in different region"
      );
    }
  } else {
    recommendations.push("✅ S3 connection is working correctly");
  }

  if (configValidation.valid && connectionTest.success) {
    recommendations.push("🚀 AWS S3 integration is ready for file uploads!");
  }

  return recommendations;
}
